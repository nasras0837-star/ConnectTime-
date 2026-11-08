import { createPrivateKey, constants, sign } from "node:crypto";

const AUTH_URL = "https://auth.api.yoti.com/v1/oauth/token";

export type YotiSandboxConfig = {
  sdkId: string;
  privateKeyPem: string;
};

export function buildYotiClientAssertion(
  config: YotiSandboxConfig,
  nowSeconds = Math.floor(Date.now() / 1000),
  jti = cryptoRandomId(),
): string {
  if (!config.sdkId || !config.privateKeyPem) {
    throw new Error("Yoti sandbox credentials are not configured");
  }

  const header = encodeBase64Url({ alg: "PS384", typ: "JWT" });
  const payload = encodeBase64Url({
    iss: `sdk:${config.sdkId}`,
    sub: `sdk:${config.sdkId}`,
    aud: AUTH_URL,
    jti,
    iat: nowSeconds,
    exp: nowSeconds + 300,
  });
  const signingInput = `${header}.${payload}`;
  const privateKey = createPrivateKey(config.privateKeyPem);
  const signature = sign("sha384", Buffer.from(signingInput), {
    key: privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_MAX_SIGN,
  });

  return `${signingInput}.${signature.toString("base64url")}`;
}

export function buildYotiSandboxSessionRequest(referenceId: string) {
  if (!referenceId || referenceId.length > 128) {
    throw new Error("A valid opaque Yoti reference is required");
  }

  return {
    type: "OVER",
    ttl: 900,
    digital_id: { allowed: false, threshold: 18, retry_limit: 1 },
    doc_scan: {
      allowed: true,
      threshold: 18,
      authenticity: "AUTO",
      level: "PASSIVE",
      retry_limit: 1,
    },
    age_estimation: { allowed: false, threshold: 18, retry_limit: 1 },
    credit_card: { allowed: false, retry_limit: 1 },
    mobile: { allowed: false, retry_limit: 1 },
    reference_id: referenceId,
  };
}

function encodeBase64Url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function cryptoRandomId(): string {
  return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(16))).toString("hex");
}
