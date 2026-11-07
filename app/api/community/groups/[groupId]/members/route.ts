import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function contextFor(groupId: string, userId: string) {
  const groups = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const members = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  const profiles = process.env.APPWRITE_PROFILES_TABLE_ID;
  if (!groups || !members || !profiles) throw new Error("Group member storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const [group, ownRows] = await Promise.all([
    tablesDB.getRow({ databaseId, tableId: groups, rowId: groupId }),
    tablesDB.listRows({ databaseId, tableId: members, queries: [Query.equal("group_id", groupId), Query.equal("user_id", userId), Query.equal("status", "active"), Query.limit(1)] })
  ]);
  return { tablesDB, databaseId, members, profiles, group, ownMembership: ownRows.rows[0] || null };
}

export async function GET(_request: Request, context: { params: Promise<{ groupId: string }> }) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view group membership." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const { groupId } = await context.params;
  try {
    const s = await contextFor(groupId, user.$id);
    const isOwner = s.group.owner_user_id === user.$id || s.ownMembership?.role === "owner";
    if (!isOwner) return NextResponse.json({ isOwner: false, requests: [] }, { headers: { "Cache-Control": "no-store" } });
    const pending = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("status", "pending"), Query.limit(100)] });
    const requests = [];
    for (const row of pending.rows) {
      const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profiles, queries: [Query.equal("user_id", String(row.user_id)), Query.limit(1)] });
      const profile = profileRows.rows[0];
      requests.push({ id: String(row.$id), handle: String(profile?.handle || "member"), displayName: String(profile?.display_name || "Member"), country: String(profile?.country || "") });
    }
    return NextResponse.json({ isOwner: true, requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group member requests lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Group membership requests are unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to manage group requests." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid membership decision." }, { status: 400 }); }
  const membershipId = typeof body.membershipId === "string" ? body.membershipId.trim().slice(0, 128) : "";
  const action = body.action === "approve" || body.action === "decline" ? body.action : "";
  if (!membershipId || !action) return NextResponse.json({ error: "Choose a valid membership request and decision." }, { status: 400 });
  const { groupId } = await context.params;
  try {
    const s = await contextFor(groupId, user.$id);
    const isOwner = s.group.owner_user_id === user.$id || s.ownMembership?.role === "owner";
    if (!isOwner) return NextResponse.json({ error: "Only this group's owner can manage membership requests." }, { status: 403 });
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId });
    if (row.group_id !== groupId || row.status !== "pending") return NextResponse.json({ error: "This membership request is no longer pending." }, { status: 409 });
    await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId, data: { status: action === "approve" ? "active" : "declined", updated_at: new Date().toISOString() } });
    return NextResponse.json({ updated: true, status: action === "approve" ? "active" : "declined" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group membership decision failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not update this membership request." }, { status: 503 });
  }
}
