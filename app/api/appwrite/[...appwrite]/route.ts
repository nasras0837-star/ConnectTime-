import { NextRequest, NextResponse } from "next/server";
import { createAppwriteHandlers } from "@appwrite.io/react/handlers/next";

function handlers() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!endpoint || !projectId || !apiKey) return null;
  return createAppwriteHandlers({
    endpoint,
    projectId,
    apiKey,
    basePath: "/api/appwrite",
    cookieOptions: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    },
  });
}

async function unavailable() {
  return NextResponse.json(
    { error: "Appwrite is not configured for this deployment." },
    { status: 503 },
  );
}

/**
 * Build an exact origin allowlist for this deployment. Render's public URL
 * and Vercel's deployment URL are platform-provided hostnames; APP_BASE_URL
 * and APP_ALLOWED_ORIGINS support explicitly configured stable domains.
 * Never use wildcard suffix matching for preview domains.
 */
function trustedOrigins(request: NextRequest) {
  const configured = [
    process.env.APP_BASE_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
    ...(process.env.APP_ALLOWED_ORIGINS ?? "").split(","),
  ];

  const origins = new Set<string>();
  for (const value of configured) {
    if (!value?.trim()) continue;
    try {
      origins.add(new URL(value.trim()).origin);
    } catch {
      // Ignore malformed optional entries; a valid explicit origin is required.
    }
  }

  // In local development only, allow the request's own origin.
  if (process.env.NODE_ENV !== "production") {
    try {
      origins.add(new URL(request.url).origin);
    } catch {
      // Fail closed below if the request URL is malformed.
    }
  }

  return origins;
}

function isCrossSiteMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") return true;
  if (!origin) return fetchSite !== "same-origin";

  try {
    return !trustedOrigins(request).has(new URL(origin).origin);
  } catch {
    return true;
  }
}

async function forbidden() {
  return NextResponse.json(
    { error: "Cross-origin authentication requests are not allowed." },
    {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET(request: NextRequest) {
  const configured = handlers();
  return configured ? configured.GET(request) : unavailable();
}

export async function POST(request: NextRequest) {
  if (isCrossSiteMutation(request)) return forbidden();
  const configured = handlers();
  return configured ? configured.POST(request) : unavailable();
}
