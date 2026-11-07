import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { communitySafetyStore, cleanText, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { ID } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view blocked members." }, { status: 401 });
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    if (!tableId) throw new Error("Community blocks table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", user.$id), Query.orderDesc("$createdAt"), Query.limit(100)] });
    return NextResponse.json({ blocks: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Blocked member listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Block storage is not configured or is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before blocking a member." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid block request." }, { status: 400 }); }
  const blockedUserId = cleanText(body.blockedUserId, 128);
  if (!blockedUserId || blockedUserId === user.$id) return NextResponse.json({ error: "Choose another member to block." }, { status: 400 });
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    if (!tableId) throw new Error("Community blocks table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const existing = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", blockedUserId), Query.limit(1)] });
    if (existing.rows[0]) return NextResponse.json({ blocked: true, alreadyBlocked: true, blockId: existing.rows[0].$id });
    const row = await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: { blocker_user_id: user.$id, blocked_user_id: blockedUserId, created_at: new Date().toISOString() } });
    return NextResponse.json({ blocked: true, blockId: row.$id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Member block failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Block storage is not configured or is temporarily unavailable. The member was not blocked." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before unblocking a member." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid unblock request." }, { status: 400 }); }
  const blockedUserId = cleanText(body.blockedUserId, 128);
  if (!blockedUserId) return NextResponse.json({ error: "Blocked member ID is required." }, { status: 400 });
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    if (!tableId) throw new Error("Community blocks table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const existing = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", blockedUserId), Query.limit(10)] });
    await Promise.all(existing.rows.map(row => tablesDB.deleteRow({ databaseId, tableId, rowId: row.$id })));
    return NextResponse.json({ unblocked: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Member unblock failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Block storage is not configured or is temporarily unavailable." }, { status: 503 });
  }
}
