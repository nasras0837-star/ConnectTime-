import { NextResponse } from "next/server";
import { ID, Query, Client, Databases, TablesDB } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function services() {
  const postsTableId = process.env.APPWRITE_COMMUNITY_POSTS_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!postsTableId || !profilesTableId || !blocksTableId || !endpoint || !projectId || !apiKey || !accessDatabaseId || !accessCollectionId) throw new Error("Community feed storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, postsTableId, profilesTableId, blocksTableId, databases, accessDatabaseId, accessCollectionId };
}

async function eligible(s: ReturnType<typeof services>, userId: string) {
  try {
    const row = await s.databases.getDocument(s.accessDatabaseId, s.accessCollectionId, userId);
    return isEligible({ adult_status: row.adult_status, account_status: row.account_status });
  } catch { return false; }
}

async function blocked(s: ReturnType<typeof services>, a: string, b: string) {
  const [ab, ba] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", a), Query.equal("blocked_user_id", b), Query.limit(1)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", b), Query.equal("blocked_user_id", a), Query.limit(1)] })
  ]);
  return ab.rows.length > 0 || ba.rows.length > 0;
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view the community feed." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = services();
    const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.postsTableId, queries: [Query.orderDesc("created_at"), Query.limit(60)] });
    const posts = [];
    for (const row of result.rows) {
      const authorId = String(row.author_user_id || "");
      if (!authorId || await blocked(s, user.$id, authorId) || !await eligible(s, authorId)) continue;
      const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", authorId), Query.limit(1)] });
      const profile = profileRows.rows[0];
      if (!profile || !["public", "members"].includes(String(profile.visibility || ""))) continue;
      posts.push({ id: String(row.$id), body: String(row.body || ""), createdAt: String(row.created_at || ""), author: { handle: String(profile.handle || ""), displayName: String(profile.display_name || profile.handle || "") }, mine: authorId === user.$id });
    }
    return NextResponse.json({ posts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community feed lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The community feed is not configured or is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before publishing a post." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid post." }, { status: 400 }); }
  const content = typeof body.body === "string" ? body.body.trim() : "";
  if (!content || content.length > 1500) return NextResponse.json({ error: "A text post must contain 1–1,500 characters." }, { status: 400 });
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(content)) return NextResponse.json({ error: "The post contains unsupported control characters." }, { status: 400 });
  try {
    const s = services();
    const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.postsTableId, queries: [Query.equal("author_user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 10 * 60_000).toISOString()), Query.limit(6)] });
    if (recent.rows.length >= 5) return NextResponse.json({ error: "You have reached the posting limit. Please wait before publishing again." }, { status: 429 });
    const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", user.$id), Query.limit(1)] });
    if (!profileRows.rows[0] || !["public", "members"].includes(String(profileRows.rows[0].visibility || ""))) return NextResponse.json({ error: "Set your profile visibility to Public or Signed-in members before posting." }, { status: 403 });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.postsTableId, rowId: ID.unique(), data: { author_user_id: user.$id, body: content, created_at: now, updated_at: now, status: "published" } });
    return NextResponse.json({ published: true, post: { id: String(row.$id), body: content, createdAt: now, author: { handle: String(profileRows.rows[0].handle || ""), displayName: String(profileRows.rows[0].display_name || profileRows.rows[0].handle || "") }, mine: true } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community post creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The post could not be published. Check the private Appwrite posts table." }, { status: 503 });
  }
}
