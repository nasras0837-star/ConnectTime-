import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const groups = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const members = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  const messages = process.env.APPWRITE_COMMUNITY_GROUP_MESSAGES_TABLE_ID;
  const profiles = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocks = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  if (!groups || !members || !messages || !profiles || !blocks) throw new Error("Group chat storage is not fully configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, groups, members, messages, profiles, blocks };
}

async function activeMember(s: ReturnType<typeof config>, groupId: string, userId: string) {
  const rows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("user_id", userId), Query.equal("status", "active"), Query.limit(1)] });
  return rows.rows[0] || null;
}

async function blockedSet(s: ReturnType<typeof config>, userId: string) {
  const [outgoing, incoming] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocks, queries: [Query.equal("blocker_user_id", userId), Query.limit(500)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocks, queries: [Query.equal("blocked_user_id", userId), Query.limit(500)] })
  ]);
  return new Set([...outgoing.rows.map(row => String(row.blocked_user_id)), ...incoming.rows.map(row => String(row.blocker_user_id))]);
}

async function decorate(s: ReturnType<typeof config>, row: Record<string, unknown>, blocked: Set<string>, viewerId: string) {
  const authorId = String(row.author_user_id || "");
  if (blocked.has(authorId)) return null;
  const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profiles, queries: [Query.equal("user_id", authorId), Query.limit(1)] });
  const profile = result.rows[0];
  return {
    id: String(row.$id),
    body: String(row.body || ""),
    createdAt: String(row.created_at || ""),
    author: { handle: String(profile?.handle || "member"), displayName: String(profile?.display_name || "Member") },
    mine: authorId === viewerId
  };
}

export async function GET(_request: Request, context: { params: Promise<{ groupId: string }> }) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to use group chat." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const { groupId } = await context.params;
  try {
    const s = config();
    const [group, membership] = await Promise.all([
      s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.groups, rowId: groupId }),
      activeMember(s, groupId, user.$id)
    ]);
    if (group.status !== "active" || !membership) return NextResponse.json({ error: "Active group membership is required to view group chat." }, { status: 403 });
    const [result, blocked] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messages, queries: [Query.equal("group_id", groupId), Query.orderDesc("created_at"), Query.limit(100)] }),
      blockedSet(s, user.$id)
    ]);
    const rows = result.rows.slice().reverse();
    const messages = (await Promise.all(rows.map(row => decorate(s, row, blocked, user.$id)))).filter(Boolean);
    return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group chat lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Group chat is not configured or is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before sending a group message." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid group message." }, { status: 400 }); }
  const message = typeof body.body === "string" ? body.body.trim() : "";
  if (!message || message.length > 2000) return NextResponse.json({ error: "A group message must contain 1–2,000 characters." }, { status: 400 });
  const { groupId } = await context.params;
  try {
    const s = config();
    const [group, membership, recent] = await Promise.all([
      s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.groups, rowId: groupId }),
      activeMember(s, groupId, user.$id),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messages, queries: [Query.equal("author_user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 60_000).toISOString()), Query.limit(21)] })
    ]);
    if (group.status !== "active" || !membership) return NextResponse.json({ error: "Active group membership is required to send messages." }, { status: 403 });
    if (recent.rows.length >= 20) return NextResponse.json({ error: "You're sending messages too quickly. Please wait a minute." }, { status: 429 });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.messages, rowId: ID.unique(), data: { group_id: groupId, author_user_id: user.$id, body: message, created_at: now } });
    const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profiles, queries: [Query.equal("user_id", user.$id), Query.limit(1)] });
    const profile = profileRows.rows[0];
    const notificationsTable = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
    if (notificationsTable) {
      try {
        const [memberRows, outgoingBlocks, incomingBlocks] = await Promise.all([
          s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("status", "active"), Query.limit(100)] }),
          s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocks, queries: [Query.equal("blocker_user_id", user.$id), Query.limit(500)] }),
          s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocks, queries: [Query.equal("blocked_user_id", user.$id), Query.limit(500)] })
        ]);
        const blockedUsers = new Set([
          ...outgoingBlocks.rows.map(item => String(item.blocked_user_id)),
          ...incomingBlocks.rows.map(item => String(item.blocker_user_id))
        ]);
        const recipients = memberRows.rows.filter(item => item.user_id !== user.$id && !blockedUsers.has(String(item.user_id)));
        await Promise.all(recipients.map(item => s.tablesDB.createRow({ databaseId: s.databaseId, tableId: notificationsTable, rowId: ID.unique(), data: { recipient_user_id: String(item.user_id), actor_user_id: user.$id, type: "group_message", message: "A new message was posted in a community group.", reference_id: groupId, is_read: false, created_at: now } })));
      } catch (error) { console.error("Group chat notifications could not be saved", error instanceof Error ? error.message : "unknown"); }
    }
    return NextResponse.json({ sent: true, message: { id: String(row.$id), body: message, createdAt: now, author: { handle: String(profile?.handle || "you"), displayName: String(profile?.display_name || "You") }, mine: true } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group message send failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Group message could not be sent." }, { status: 503 });
  }
}
