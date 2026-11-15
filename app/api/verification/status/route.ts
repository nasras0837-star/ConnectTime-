import { NextResponse } from "next/server";
import { Client, Query, TablesDB } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";

export const dynamic = "force-dynamic";

async function isVeriffReady(): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const recordsTableId = process.env.APPWRITE_VERIFICATION_RECORDS_TABLE_ID;
  const baseUrl = process.env.VERIFF_BASE_URL;
  const veriffKey = process.env.VERIFF_API_KEY;
  const sharedSecret = process.env.VERIFF_SHARED_SECRET;
  const callbackUrl = process.env.VERIFF_CALLBACK_URL;

  if (![endpoint, projectId, apiKey, databaseId, recordsTableId, baseUrl, veriffKey, sharedSecret, callbackUrl].every(value => value?.trim())) return false;

  try {
    const base = new URL(baseUrl!);
    const callback = new URL(callbackUrl!);
    if (base.protocol !== "https:" || callback.protocol !== "https:" ||
      !callback.pathname.endsWith("/api/verification/webhook")) return false;

    const client = new Client().setEndpoint(endpoint!).setProject(projectId!).setKey(apiKey!);
    // Check the actual private table with the server key, not just env presence.
    await new TablesDB(client).listRows({
      databaseId: databaseId!,
      tableId: recordsTableId!,
      queries: [Query.limit(1)],
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const result = await checkMemberAccess();

  // Do not run provider/Appwrite readiness probes for signed-out visitors.
  if (!result.allowed && result.reason === "unauthenticated") {
    return NextResponse.json(
      { status: "unauthenticated", providerReady: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const providerReady = await isVeriffReady();

  if (!result.allowed) {
    if (result.reason === "not_eligible") {
      return NextResponse.json(
        { adultStatus: "pending", accountStatus: "pending", providerReady },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { status: "unavailable", providerReady: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { adultStatus: "verified", accountStatus: "active", providerReady },
    { headers: { "Cache-Control": "no-store" } },
  );
}
