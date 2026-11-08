import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to join a group." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const { groupId } = await context.params;
  const groupsTableId = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const membersTableId = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  if (!groupsTableId || !membersTableId) return NextResponse.json({ error: "Group storage is not configured." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const group = await tablesDB.getRow({ databaseId, tableId: groupsTableId, rowId: groupId });
    if (group.status !== "active" || group.privacy === "private") return NextResponse.json({ error: "This group is private or unavailable. An invitation is required." }, { status: 403 });
    const existing = await tablesDB.listRows({ databaseId, tableId: membersTableId, queries: [Query.equal("group_id", groupId), Query.equal("user_id", user.$id), Query.limit(1)] });
    if (existing.rows[0]) {
      if (existing.rows[0].status === "active") return NextResponse.json({ joined: true, alreadyMember: true });
      await tablesDB.updateRow({ databaseId, tableId: membersTableId, rowId: existing.rows[0].$id, data: { status: group.membership === "approval" ? "pending" : "active", updated_at: new Date().toISOString() } });
    } else {
      await tablesDB.createRow({ databaseId, tableId: membersTableId, rowId: ID.unique(), data: { group_id: groupId, user_id: user.$id, role: "member", status: group.membership === "approval" ? "pending" : "active", created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    }
    return NextResponse.json({ joined: group.membership !== "approval", pending: group.membership === "approval" }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community group membership failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not update group membership." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to leave a group." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const { groupId } = await context.params;
  const membersTableId = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  if (!membersTableId) return NextResponse.json({ error: "Group storage is not configured." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const rows = await tablesDB.listRows({ databaseId, tableId: membersTableId, queries: [Query.equal("group_id", groupId), Query.equal("user_id", user.$id), Query.limit(1)] });
    const membership = rows.rows[0];
    if (!membership) return NextResponse.json({ left: true });
    if (membership.role === "owner") return NextResponse.json({ error: "Transfer ownership or close the group before leaving as owner." }, { status: 409 });
    await tablesDB.updateRow({ databaseId, tableId: membersTableId, rowId: membership.$id, data: { status: "left", updated_at: new Date().toISOString() } });
    return NextResponse.json({ left: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not leave this group." }, { status: 503 });
  }
}
