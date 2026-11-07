import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";
import { Client, Databases } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function eligible(userId: string) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const db = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const table = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !db || !table) return false;
  try {
    const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
    const row = await databases.getDocument(db, table, userId);
    return isEligible({ adult_status: row.adult_status, account_status: row.account_status });
  } catch { return false; }
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view group invitations." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const groupsTable = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const membersTable = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  if (!groupsTable || !membersTable) return NextResponse.json({ error: "Group storage is not configured." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const rows = await tablesDB.listRows({ databaseId, tableId: membersTable, queries: [Query.equal("user_id", user.$id), Query.equal("status", "invited"), Query.limit(100)] });
    const invitations = [];
    for (const row of rows.rows) {
      try {
        const group = await tablesDB.getRow({ databaseId, tableId: groupsTable, rowId: String(row.group_id) });
        if (group.status !== "active" || !await eligible(user.$id)) continue;
        invitations.push({ id: String(row.$id), groupId: String(group.$id), groupName: String(group.name || "Community group"), description: String(group.description || ""), privacy: String(group.privacy || "private"), invitedAt: String(row.created_at || "") });
      } catch { /* Ignore removed or unavailable groups. */ }
    }
    return NextResponse.json({ invitations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group invitations lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Group invitations are temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to respond to invitations." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid invitation response." }, { status: 400 }); }
  const invitationId = typeof body.invitationId === "string" ? body.invitationId.trim().slice(0, 128) : "";
  const action = body.action === "accept" || body.action === "decline" ? body.action : "";
  if (!invitationId || !action) return NextResponse.json({ error: "Choose an invitation and response." }, { status: 400 });
  const membersTable = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  const groupsTable = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const blocksTable = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  if (!membersTable || !groupsTable || !blocksTable) return NextResponse.json({ error: "Group storage is not configured." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const row = await tablesDB.getRow({ databaseId, tableId: membersTable, rowId: invitationId });
    if (row.user_id !== user.$id || row.status !== "invited") return NextResponse.json({ error: "This invitation is no longer available." }, { status: 404 });
    const group = await tablesDB.getRow({ databaseId, tableId: groupsTable, rowId: String(row.group_id) });
    if (group.status !== "active") return NextResponse.json({ error: "This group is no longer available." }, { status: 404 });
    if (action === "accept") {
      const ownerId = String(group.owner_user_id || "");
      const [stillEligible, outgoing, incoming] = await Promise.all([
        eligible(user.$id),
        tablesDB.listRows({ databaseId, tableId: blocksTable, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", ownerId), Query.limit(1)] }),
        tablesDB.listRows({ databaseId, tableId: blocksTable, queries: [Query.equal("blocker_user_id", ownerId), Query.equal("blocked_user_id", user.$id), Query.limit(1)] })
      ]);
      if (!stillEligible || outgoing.rows.length || incoming.rows.length) return NextResponse.json({ error: "This invitation is no longer eligible to accept." }, { status: 403 });
    }
    const updated = await tablesDB.updateRow({ databaseId, tableId: membersTable, rowId: invitationId, data: { status: action === "accept" ? "active" : "declined", updated_at: new Date().toISOString() } });
    return NextResponse.json({ updated: true, status: updated.status, groupId: String(group.$id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group invitation response failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Your invitation response could not be saved." }, { status: 503 });
  }
}
