import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidAppwriteEndpoint(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.replace(/\/$/, "").endsWith("/v1") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function GET() {
  // A private Appwrite API key is never a valid endpoint. Validate the URL
  // shape so a misplaced standard_... key cannot mark registration ready.
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const missing = [
    !isValidAppwriteEndpoint(endpoint) && "NEXT_PUBLIC_APPWRITE_ENDPOINT (must be an HTTPS Appwrite /v1 URL)",
    !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID && "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    !process.env.APPWRITE_API_KEY && "APPWRITE_API_KEY",
  ].filter((value): value is string => Boolean(value));

  return NextResponse.json(
    { configured: missing.length === 0, missing },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
