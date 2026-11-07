import { NextResponse } from "next/server";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";

export const dynamic = "force-dynamic";

export async function POST() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return NextResponse.json({ error: "verification_unavailable" }, { status: 503 });
  const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  // No vendor is configured yet. Never fabricate a session or mark a member verified.
  if (!process.env.AGE_VERIFICATION_PROVIDER || !process.env.AGE_VERIFICATION_API_KEY) {
    return NextResponse.json({ error: "verification_provider_not_configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  // Provider-specific session creation must be implemented only after vendor selection,
  // SDK/API contract review, signed callback verification, and staging credentials.
  return NextResponse.json({ error: "verification_integration_pending" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
