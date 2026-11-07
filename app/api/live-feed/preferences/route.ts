import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedTopics = ["News", "Sports", "Entertainment", "Music", "Business", "Science & Space"] as const;
const defaults = { friend_requests: true, friend_acceptances: true, private_messages: true, product_updates: false };
type Topic = typeof allowedTopics[number];

function store() {
  const tableId = process.env.APPWRITE_MEMBER_SETTINGS_TABLE_ID;
  if (!tableId) throw new Error("Member settings table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

function parseTopics(value: unknown): Topic[] {
  if (typeof value !== "string") return ["News", "Sports", "Entertainment"];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return ["News", "Sports", "Entertainment"];
    return [...new Set(parsed.filter((item): item is Topic => typeof item === "string" && allowedTopics.includes(item as Topic)))];
  } catch {
    return ["News", "Sports", "Entertainment"];
  }
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to sync your live-feed interests." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = store();
    try {
      const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
      if (row.user_id !== user.$id) return NextResponse.json({ error: "Settings ownership check failed." }, { status: 403 });
      return NextResponse.json({ topics: parseTopics(row.live_feed_topics) }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 404) {
        return NextResponse.json({ topics: ["News", "Sports", "Entertainment"] }, { headers: { "Cache-Control": "no-store" } });
      }
      throw error;
    }
  } catch (error) {
    console.error("Live-feed preference lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Live-feed preferences are unavailable. Check the private Appwrite settings table." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before syncing live-feed interests." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid live-feed preferences." }, { status: 400 }); }
  if (!Array.isArray(body.topics) || body.topics.length > allowedTopics.length || body.topics.some(topic => typeof topic !== "string" || !allowedTopics.includes(topic as Topic))) {
    return NextResponse.json({ error: "Choose only the available live-feed topics." }, { status: 400 });
  }
  const topics = [...new Set(body.topics as Topic[])];
  try {
    const s = store();
    const now = new Date().toISOString();
    try {
      const existing = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
      if (existing.user_id !== user.$id) return NextResponse.json({ error: "Settings ownership check failed." }, { status: 403 });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id, data: { live_feed_topics: JSON.stringify(topics), updated_at: now } });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
      await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: ID.custom(user.$id), data: { user_id: user.$id, ...defaults, live_feed_topics: JSON.stringify(topics), created_at: now, updated_at: now } });
    }
    return NextResponse.json({ saved: true, topics }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Live-feed preference save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not sync live-feed preferences. Check the Appwrite table configuration." }, { status: 503 });
  }
}
