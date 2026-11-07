import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const groups = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const members = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  const posts = process.env.APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID;
  if (!groups || !members || !posts) throw new Error("Group discussion storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, groups, members, posts };
}

async function member(s: ReturnType<typeof config>, groupId: string, userId: string) {
  const rows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("user_id", userId), Query.equal("status", "active"), Query.limit(1)] });
  return rows.rows[0] || null;
}

export async function GET(_request: Request, context: { params: Promise<{ groupId: string }> }) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view this discussion." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const { groupId } = await context.params;
  try {
    const s = config();
    const group = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.groups, rowId: groupId });
    const isMember = await member(s, groupId, user.$id);
    if (group.status !== "active" || (group.privacy !== "public" && !isMember)) return NextResponse.json({ error: "Join this group to view its discussion." }, { status: 403 });
    const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.posts, queries: [Query.equal("group_id", groupId), Query.equal("status", "published"), Query.orderDesc("created_at"), Query.limit(60)] });
    const profiles = process.env.APPWRITE_PROFILES_TABLE_ID;
    const items = [];
    for (const row of result.rows) {
      const profileRows = profiles ? await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: profiles, queries: [Query.equal("user_id", String(row.author_user_id)), Query.limit(1)] }) : { rows: [] };
      const profile = profileRows.rows[0];
      items.push({ id: String(row.$id), body: String(row.body || ""), createdAt: String(row.created_at || ""), author: { handle: String(profile?.handle || "member"), displayName: String(profile?.display_name || "Member") } });
    }
    return NextResponse.json({ group: { id: String(group.$id), name: String(group.name), description: String(group.description || ""), privacy: String(group.privacy) }, posts: items, member: Boolean(isMember) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Group discussion is not configured or unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before posting in a group." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid discussion post." }, { status: 400 }); }
  const content = typeof body.body === "string" ? body.body.trim() : "";
  if (!content || content.length > 1500) return NextResponse.json({ error: "A discussion post must contain 1–1,500 characters." }, { status: 400 });
  const { groupId } = await context.params;
  try {
    const s = config();
    const group = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.groups, rowId: groupId });
    if (group.status !== "active" || !await member(s, groupId, user.$id)) return NextResponse.json({ error: "Active group membership is required to post." }, { status: 403 });
    const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.posts, queries: [Query.equal("author_user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 10 * 60_000).toISOString()), Query.limit(11)] });
    if (recent.rows.length >= 10) return NextResponse.json({ error: "Please wait before posting again." }, { status: 429 });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.posts, rowId: ID.unique(), data: { group_id: groupId, author_user_id: user.$id, body: content, status: "published", created_at: now, updated_at: now } });
    return NextResponse.json({ published: true, post: { id: String(row.$id), body: content, createdAt: now, author: { handle: "you", displayName: "You" } } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not publish to this group." }, { status: 503 });
  }
}
