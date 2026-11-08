import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

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
  return { tablesDB, databaseId, groups, members, profiles, group, ownMembership: ownRows.rows[0] || null };
}

async function eligibleTarget(userId: string) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const accessDb = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessTable = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !accessDb || !accessTable) throw new Error("Member eligibility is not configured.");
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  try {
    const record = await databases.getDocument(accessDb, accessTable, userId);
    return isEligible({ adult_status: record.adult_status, account_status: record.account_status });
  } catch { return false; }
}

async function isBlocked(tablesDB: ReturnType<typeof communitySafetyStore>["tablesDB"], databaseId: string, tableId: string, a: string, b: string) {
  const [forward, reverse] = await Promise.all([
    tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", a), Query.equal("blocked_user_id", b), Query.limit(1)] }),
    tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", b), Query.equal("blocked_user_id", a), Query.limit(1)] })
  ]);
  // A block in either direction must prevent invitations and related contact.
  return forward.rows.length > 0 || reverse.rows.length > 0;
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
    const [pending, invited, activeRows] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("status", "pending"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("status", "invited"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("status", "active"), Query.limit(100)] })
    ]);
    async function decorate(row: Record<string, unknown>) {
      const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profiles, queries: [Query.equal("user_id", String(row.user_id)), Query.limit(1)] });
      const profile = profileRows.rows[0];
      return { id: String(row.$id), handle: String(profile?.handle || "member"), displayName: String(profile?.display_name || "Member"), country: String(profile?.country || "") };
    }
    const [requests, invitations, members] = await Promise.all([
      Promise.all(pending.rows.map(decorate)), Promise.all(invited.rows.map(decorate)),
      Promise.all(activeRows.rows.map(async row => ({ ...await decorate(row), role: String(row.role || "member"), isCurrentUser: String(row.user_id) === user.$id })))
    ]);
    return NextResponse.json({ isOwner: true, requests, invitations, members }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group member requests lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Group membership requests are unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ groupId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to invite a member." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid invitation." }, { status: 400 }); }
  const handle = typeof body.handle === "string" ? body.handle.trim().toLowerCase().slice(0, 24) : "";
  if (!/^[a-z0-9_]{3,24}$/.test(handle)) return NextResponse.json({ error: "Enter a valid member handle." }, { status: 400 });
  const { groupId } = await context.params;
  try {
    const s = await contextFor(groupId, user.$id);
    const isOwner = s.group.owner_user_id === user.$id || s.ownMembership?.role === "owner";
    if (!isOwner) return NextResponse.json({ error: "Only this group's owner can invite members." }, { status: 403 });
    if (s.group.status !== "active") return NextResponse.json({ error: "This group is unavailable." }, { status: 404 });
    const profiles = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profiles, queries: [Query.equal("handle", handle), Query.limit(2)] });
    if (profiles.rows.length !== 1) return NextResponse.json({ error: "This member is not available to invite." }, { status: 404 });
    const profile = profiles.rows[0];
    const targetId = String(profile.user_id || "");
    if (!targetId || targetId === user.$id || !["public", "members"].includes(String(profile.visibility))) return NextResponse.json({ error: "Choose another discoverable member." }, { status: 400 });
    const blocksTable = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    if (!blocksTable) throw new Error("Community block controls are not configured.");
    const [targetEligible, blocked, existing] = await Promise.all([
      eligibleTarget(targetId), isBlocked(s.tablesDB, s.databaseId, blocksTable, user.$id, targetId),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.members, queries: [Query.equal("group_id", groupId), Query.equal("user_id", targetId), Query.limit(2)] })
    ]);
    if (!targetEligible || blocked) return NextResponse.json({ error: "This member is not eligible to receive a group invitation." }, { status: 403 });
    const prior = existing.rows[0];
    if (prior?.status === "active") return NextResponse.json({ invited: true, alreadyMember: true });
    if (prior?.status === "pending") return NextResponse.json({ error: "This member already has a join request awaiting review." }, { status: 409 });
    const now = new Date().toISOString();
    if (prior) await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: prior.$id, data: { role: "member", status: "invited", updated_at: now } });
    else await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.members, rowId: ID.unique(), data: { group_id: groupId, user_id: targetId, role: "member", status: "invited", created_at: now, updated_at: now } });
    const notifications = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
    if (notifications) {
      try { await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: notifications, rowId: ID.unique(), data: { recipient_user_id: targetId, actor_user_id: user.$id, type: "group_invitation", message: "You received a community group invitation.", reference_id: groupId, is_read: false, created_at: now } }); }
      catch (error) { console.error("Group invitation notification could not be saved", error instanceof Error ? error.message : "unknown"); }
    }
    return NextResponse.json({ invited: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group invitation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The invitation could not be sent." }, { status: 503 });
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
  const action = ["approve", "decline", "remove", "transfer"].includes(String(body.action)) ? String(body.action) : "";
  if (!membershipId || !action) return NextResponse.json({ error: "Choose a valid member and action." }, { status: 400 });
  const { groupId } = await context.params;
  try {
    const s = await contextFor(groupId, user.$id);
    const isOwner = s.group.owner_user_id === user.$id || s.ownMembership?.role === "owner";
    if (!isOwner) return NextResponse.json({ error: "Only this group's owner can manage membership requests." }, { status: 403 });
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId });
    if (row.group_id !== groupId) return NextResponse.json({ error: "This member does not belong to this group." }, { status: 404 });
    const now = new Date().toISOString();
    if (action === "approve" || action === "decline") {
      if (row.status !== "pending") return NextResponse.json({ error: "This membership request is no longer pending." }, { status: 409 });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId, data: { status: action === "approve" ? "active" : "declined", updated_at: now } });
      return NextResponse.json({ updated: true, status: action === "approve" ? "active" : "declined" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (row.status !== "active" || row.role === "owner" || row.user_id === user.$id) return NextResponse.json({ error: "Choose an active non-owner member." }, { status: 409 });
    if (action === "remove") {
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId, data: { status: "removed", updated_at: now } });
      return NextResponse.json({ updated: true, status: "removed" }, { headers: { "Cache-Control": "no-store" } });
    }
    await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.groups, rowId: groupId, data: { owner_user_id: String(row.user_id), updated_at: now } });
    await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: membershipId, data: { role: "owner", updated_at: now } });
    if (s.ownMembership) await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.members, rowId: s.ownMembership.$id, data: { role: "member", updated_at: now } });
    return NextResponse.json({ updated: true, ownershipTransferred: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Group membership decision failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not update this membership request." }, { status: 503 });
  }
}
