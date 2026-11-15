import { NextResponse } from "next/server";
import { Client, Query, TablesDB } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";

export const dynamic = "force-dynamic";

async function verificationProviderReady() {
  const required = [
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    process.env.APPWRITE_API_KEY,
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_ACCESS_DATABASE_ID,
    process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID,
    process.env.APPWRITE_VERIFICATION_RECORDS_TABLE_ID,
    process.env.VERIFF_BASE_URL,
    process.env.VERIFF_API_KEY,
    process.env.VERIFF_SHARED_SECRET,
    process.env.VERIFF_CALLBACK_URL,
  ];
  if (required.some(value => !value)) return false;

  try {
    const base = new URL(process.env.VERIFF_BASE_URL!);
    const callback = new URL(process.env.VERIFF_CALLBACK_URL!);
    if (base.protocol !== "https:" || callback.protocol !== "https:" ||
      !callback.pathname.endsWith("/api/verification/webhook")) return false;
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);
    await new TablesDB(client).listRows({
      databaseId: process.env.APPWRITE_DATABASE_ID!,
      tableId: process.env.APPWRITE_VERIFICATION_RECORDS_TABLE_ID!,
      queries: [Query.limit(1)],
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const result = await checkMemberAccess();
  if (!result.allowed && result.reason === "unauthenticated") {
    return NextResponse.json(
      { status: "unauthenticated", providerReady: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const providerReady = await verificationProviderReady();

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
