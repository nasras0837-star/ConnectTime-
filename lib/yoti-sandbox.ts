import "server-only";

import { randomUUID } from "node:crypto";
import {
  buildYotiClientAssertion,
  buildYotiSandboxSessionRequest,
  isYotiSandboxOver18Pass,
} from "./yoti-sandbox-core";

const AUTH_URL = "https://auth.api.yoti.com/v1/oauth/token";
const SESSION_URL = "https://age.yoti.com/sandbox/api/v1/sessions";
const TOKEN_REFRESH_SKEW_SECONDS = 60;

type TokenResponse = { access_token?: string; expires_in?: number; token_type?: string };
type SessionResponse = { id?: string; status?: string; expires_at?: string };

let cachedToken: { value: string; expiresAt: number } | undefined;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

async function getSandboxAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_SECONDS > Date.now()) {
    return cachedToken.value;
  }

  const sdkId = requiredEnv("YOTI_SDK_ID");
  const privateKeyPem = requiredEnv("YOTI_PRIVATE_KEY_PEM");
  const assertion = buildYotiClientAssertion({ sdkId, privateKeyPem });
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "avs:sessions:create",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: assertion,
  });

  const response = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Yoti sandbox authentication failed");

  const payload = (await response.json()) as TokenResponse;
  if (!payload.access_token || payload.token_type?.toLowerCase() !== "bearer") {
    throw new Error("Yoti returned an invalid sandbox token response");
  }

  const lifetime = Math.max(60, Math.min(payload.expires_in ?? 1800, 1800));
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + lifetime * 1000 };
  return payload.access_token;
}

export async function createYotiSandboxSession() {
  if (process.env.YOTI_SANDBOX_ENABLED !== "true") {
    throw new Error("Yoti sandbox is not explicitly enabled");
  }

  const sdkId = requiredEnv("YOTI_SDK_ID");
  const referenceId = randomUUID();
  const accessToken = await getSandboxAccessToken();
  const response = await fetch(SESSION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Yoti-SDK-Id": sdkId,
    },
    body: JSON.stringify(buildYotiSandboxSessionRequest(referenceId)),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Yoti sandbox session creation failed");

  const payload = (await response.json()) as SessionResponse;
  if (!payload.id || payload.status !== "PENDING" || !payload.expires_at) {
    throw new Error("Yoti returned an invalid sandbox session response");
  }

  const sessionUrl = new URL("https://age.yoti.com/sandbox");
  sessionUrl.searchParams.set("sessionId", payload.id);
  sessionUrl.searchParams.set("sdkId", sdkId);

  return {
    sessionId: payload.id,
    referenceId,
    expiresAt: payload.expires_at,
    sessionUrl: sessionUrl.toString(),
  };
}


export async function getYotiSandboxSessionResult(sessionId: string) {
  if (process.env.YOTI_SANDBOX_ENABLED !== "true") {
    throw new Error("Yoti sandbox is not explicitly enabled");
  }
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    throw new Error("Invalid Yoti session identifier");
  }

  const sdkId = requiredEnv("YOTI_SDK_ID");
  const accessToken = await getSandboxAccessToken();
  const response = await fetch(`https://age.yoti.com/sandbox/api/v1/sessions/${sessionId}/result`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Yoti-SDK-Id": sdkId,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Yoti sandbox result retrieval failed");

  const payload = (await response.json()) as {
    id?: string;
    sdk_id?: string;
    type?: string;
    status?: string;
    reference_id?: string;
  };
  if (!payload.status || !payload.reference_id) {
    throw new Error("Yoti sandbox returned an incomplete result");
  }
  if (payload.id !== sessionId || payload.sdk_id !== sdkId || payload.type !== "OVER") {
    throw new Error("Yoti sandbox returned a mismatched result");
  }

  return {
    sessionId,
    status: payload.status,
    referenceId: payload.reference_id,
    over18SandboxPass: isYotiSandboxOver18Pass(payload, { sessionId, sdkId, referenceId: payload.reference_id }),
  };
}
