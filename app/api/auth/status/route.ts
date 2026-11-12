import { NextResponse } from "next/server";
import { Client, Query, Users } from "node-appwrite";

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
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const missing = [
    !isValidAppwriteEndpoint(endpoint) && "NEXT_PUBLIC_APPWRITE_ENDPOINT (must be an HTTPS Appwrite /v1 URL)",
    !projectId && "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    !apiKey && "APPWRITE_API_KEY",
  ].filter((value): value is string => Boolean(value));

  // Check that the server key actually reaches the configured Appwrite project.
  // A successful users.list request also confirms the key has users.read.
  let apiKeyUsable = false;
  if (missing.length === 0) {
    try {
      const client = new Client().setEndpoint(endpoint!).setProject(projectId!).setKey(apiKey!);
      await new Users(client).list({ queries: [Query.limit(1)] });
      apiKeyUsable = true;
    } catch {
      missing.push("APPWRITE_API_KEY (invalid, wrong project, or missing users.read permission)");
    }
  }

  const configured = missing.length === 0 && apiKeyUsable;
  return NextResponse.json(
    { configured, missing },
    { status: configured ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
