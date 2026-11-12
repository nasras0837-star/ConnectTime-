import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, cleanText, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before requesting account closure." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid closure request." }, { status: 400 }); }
  if (body.confirmed !== true) return NextResponse.json({ error: "Confirm that you want to request account closure." }, { status: 400 });
  const reason = cleanText(body.reason, 500);
  try {
    const tableId = process.env.APPWRITE_ACCOUNT_CLOSURE_REQUESTS_TABLE_ID;
    if (!tableId) throw new Error("Account closure request table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const existing = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("user_id", user.$id), Query.equal("status", "pending_review"), Query.limit(1)] });
    if (existing.rows.length) return NextResponse.json({ requested: true, message: "You already have an account closure request awaiting review." }, { headers: { "Cache-Control": "no-store" } });
    const row = await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: { user_id: user.$id, reason, status: "pending_review", requested_at: new Date().toISOString() } });
    return NextResponse.json({ requested: true, reference: row.$id, message: "Your account closure request was submitted for review. Your account remains active until Connect confirms that the request has been processed." }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Account closure request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The closure request service is not configured or is temporarily unavailable. No request was submitted." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
