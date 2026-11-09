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
 * Render terminates TLS at its edge, so request.url is not a reliable
 * source of the public origin in every deployment topology. Use the
 * explicitly configured public app URL instead, with Render's assigned
 * URL as a safe deployment fallback.
 */
function isCrossSiteMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite === "cross-site") return true;

  // Browser POST requests include Origin. Reject requests without it unless
  // Fetch Metadata explicitly identifies a same-origin browser request.
  if (!origin) return fetchSite !== "same-origin";

  try {
    const publicAppUrl =
      process.env.APP_BASE_URL ??
      process.env.RENDER_EXTERNAL_URL ??
      request.url;
    const expectedOrigin = new URL(publicAppUrl).origin;
    return new URL(origin).origin !== expectedOrigin;
  } catch {
    // Fail closed if either the configured public URL or Origin is malformed.
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
