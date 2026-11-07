import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function store() {
  const groupsTableId = process.env.APPWRITE_COMMUNITY_GROUPS_TABLE_ID;
  const membersTableId = process.env.APPWRITE_COMMUNITY_GROUP_MEMBERS_TABLE_ID;
  if (!groupsTableId || !membersTableId) throw new Error("Community groups storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, groupsTableId, membersTableId };
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to explore community groups." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = store();
    const [groups, memberships] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.groupsTableId, queries: [Query.equal("status", "active"), Query.orderDesc("created_at"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.membersTableId, queries: [Query.equal("user_id", user.$id), Query.equal("status", "active"), Query.limit(100)] })
    ]);
    const mine = new Set(memberships.rows.map(row => String(row.group_id)));
    const visible = groups.rows.filter(row => {
      const privacy = String(row.privacy || "public");
      return privacy === "public" || privacy === "members" || (privacy === "private" && mine.has(String(row.$id)));
    });
    return NextResponse.json({ groups: visible.map(row => ({ id: String(row.$id), name: String(row.name), description: String(row.description || ""), privacy: String(row.privacy), membership: String(row.membership || "open"), member: mine.has(String(row.$id)), createdAt: String(row.created_at || "") })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community groups lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Community groups are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before creating a group." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid group details." }, { status: 400 }); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const privacy = body.privacy === "members" || body.privacy === "private" ? body.privacy : "public";
  const membership = body.membership === "approval" ? "approval" : "open";
  if (name.length < 3 || name.length > 70 || description.length > 500) return NextResponse.json({ error: "Group name must be 3–70 characters and description no more than 500." }, { status: 400 });
  try {
    const s = store();
    const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.groupsTableId, queries: [Query.equal("owner_user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString()), Query.limit(4)] });
    if (recent.rows.length >= 3) return NextResponse.json({ error: "You can create up to three groups per day." }, { status: 429 });
    const now = new Date().toISOString();
    const group = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.groupsTableId, rowId: ID.unique(), data: { owner_user_id: user.$id, name, description, privacy, membership, status: "active", created_at: now, updated_at: now } });
    await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.membersTableId, rowId: ID.unique(), data: { group_id: group.$id, user_id: user.$id, role: "owner", status: "active", created_at: now, updated_at: now } });
    return NextResponse.json({ created: true, group: { id: String(group.$id), name, description, privacy, membership, member: true, createdAt: now } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community group creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The group could not be created. Check the private Appwrite group tables." }, { status: 503 });
  }
}
