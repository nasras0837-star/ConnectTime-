import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function watchlistTable() {
  const tableId = process.env.APPWRITE_FREE_TV_WATCHLIST_TABLE_ID;
  if (!tableId) throw new Error("Free TV watchlist table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view your watchlist." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult member access is required." }, { status: access.status });
  try {
    const { tablesDB, databaseId, tableId } = watchlistTable();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("user_id", user.$id), Query.orderDesc("$createdAt"), Query.limit(100)] });
    return NextResponse.json({ watchlist: result.rows.map(row => row.channel_id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Free TV watchlist lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Watchlist storage is not configured or is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to save channels." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult member access is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid watchlist request." }, { status: 400 }); }
  const channelId = typeof body.channelId === "string" ? body.channelId.trim() : "";
  if (!/^[a-z0-9-]{2,64}$/.test(channelId)) return NextResponse.json({ error: "Choose a valid channel." }, { status: 400 });
  try {
    const { tablesDB, databaseId, tableId } = watchlistTable();
    const existing = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("user_id", user.$id), Query.equal("channel_id", channelId), Query.limit(1)] });
    if (existing.rows[0]) return NextResponse.json({ saved: true, alreadySaved: true });
    await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: { user_id: user.$id, channel_id: channelId, created_at: new Date().toISOString() } });
    return NextResponse.json({ saved: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Free TV watchlist save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Channel could not be saved. Check the Appwrite watchlist table configuration." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to update your watchlist." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult member access is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid watchlist request." }, { status: 400 }); }
  const channelId = typeof body.channelId === "string" ? body.channelId.trim() : "";
  if (!/^[a-z0-9-]{2,64}$/.test(channelId)) return NextResponse.json({ error: "Choose a valid channel." }, { status: 400 });
  try {
    const { tablesDB, databaseId, tableId } = watchlistTable();
    const rows = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("user_id", user.$id), Query.equal("channel_id", channelId), Query.limit(10)] });
    await Promise.all(rows.rows.map(row => tablesDB.deleteRow({ databaseId, tableId, rowId: row.$id })));
    return NextResponse.json({ removed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Free TV watchlist removal failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Channel could not be removed from your watchlist." }, { status: 503 });
  }
}
