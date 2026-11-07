import { NextResponse } from "next/server";
import { ID, Query, Client, Databases } from "node-appwrite";
import { isEligible } from "@/lib/access-policy";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const commentsTableId = process.env.APPWRITE_COMMUNITY_COMMENTS_TABLE_ID;
  const reactionsTableId = process.env.APPWRITE_COMMUNITY_REACTIONS_TABLE_ID;
  const postsTableId = process.env.APPWRITE_COMMUNITY_POSTS_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!commentsTableId || !reactionsTableId || !postsTableId || !profilesTableId || !blocksTableId || !endpoint || !projectId || !apiKey || !accessDatabaseId || !accessCollectionId) throw new Error("Community interactions are not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, commentsTableId, reactionsTableId, postsTableId, profilesTableId, blocksTableId, databases, accessDatabaseId, accessCollectionId };
}

async function eligible(s: ReturnType<typeof config>, userId: string) {
  try { const row = await s.databases.getDocument(s.accessDatabaseId, s.accessCollectionId, userId); return isEligible({ adult_status: row.adult_status, account_status: row.account_status }); } catch { return false; }
}

async function verifyPost(s: ReturnType<typeof config>, postId: string) {
  try {
    const post = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.postsTableId, rowId: postId });
    return post.status === "published" ? post : null;
  } catch { return null; }
}

export async function GET(_request: Request, context: { params: Promise<{ postId: string }> }) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view post discussions." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const { postId } = await context.params;
    const s = config();
    const post = await verifyPost(s, postId);
    if (!post || !await eligible(s, String(post.author_user_id || ""))) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const [viewerBlock, authorBlock] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", String(post.author_user_id)), Query.limit(1)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", String(post.author_user_id)), Query.equal("blocked_user_id", user.$id), Query.limit(1)] })
    ]);
    if (viewerBlock.rows.length || authorBlock.rows.length) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const [comments, reactions] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.commentsTableId, queries: [Query.equal("post_id", postId), Query.equal("status", "published"), Query.orderAsc("created_at"), Query.limit(50)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.reactionsTableId, queries: [Query.equal("post_id", postId), Query.limit(100)] })
    ]);
    const visible = [];
    for (const row of comments.rows) {
      const authorId = String(row.user_id || "");
      if (!authorId) continue;
      const [profile, blockedA, blockedB] = await Promise.all([
        s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", authorId), Query.limit(1)] }),
        s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", authorId), Query.limit(1)] }),
        s.tablesDB.listRows({ databaseId: s.databaseId, tableId: process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID || "", queries: [Query.equal("blocker_user_id", authorId), Query.equal("blocked_user_id", user.$id), Query.limit(1)] })
      ]);
      if (blockedA.rows.length || blockedB.rows.length || !profile.rows[0] || !["public", "members"].includes(String(profile.rows[0].visibility || "")) || !await eligible(s, authorId)) continue;
      visible.push({ id: String(row.$id), body: String(row.body || ""), createdAt: String(row.created_at || ""), author: { handle: String(profile.rows[0].handle || ""), displayName: String(profile.rows[0].display_name || profile.rows[0].handle || "") }, mine: authorId === user.$id });
    }
    return NextResponse.json({ comments: visible, reactionCount: reactions.rows.length, reacted: reactions.rows.some(row => row.user_id === user.$id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community interactions lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Comments and reactions are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ postId: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before interacting with posts." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid interaction." }, { status: 400 }); }
  const type = body.type;
  const content = typeof body.body === "string" ? body.body.trim() : "";
  if (type !== "comment" && type !== "reaction") return NextResponse.json({ error: "Choose a valid interaction." }, { status: 400 });
  if (type === "comment" && (!content || content.length > 500 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(content))) return NextResponse.json({ error: "Comments must contain 1–500 supported characters." }, { status: 400 });
  try {
    const { postId } = await context.params;
    const s = config();
    const post = await verifyPost(s, postId);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    const [blockedByViewer, blockedByAuthor] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", String(post.author_user_id)), Query.limit(1)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", String(post.author_user_id)), Query.equal("blocked_user_id", user.$id), Query.limit(1)] })
    ]);
    if (blockedByViewer.rows.length || blockedByAuthor.rows.length) return NextResponse.json({ error: "You cannot interact with this post." }, { status: 403 });
    if (type === "comment") {
      const ownProfile = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", user.$id), Query.limit(1)] });
      if (!ownProfile.rows[0] || !["public", "members"].includes(String(ownProfile.rows[0].visibility || ""))) return NextResponse.json({ error: "Set your profile visibility to Public or Signed-in members before commenting." }, { status: 403 });
      const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.commentsTableId, queries: [Query.equal("user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 10 * 60_000).toISOString()), Query.limit(21)] });
      if (recent.rows.length >= 20) return NextResponse.json({ error: "You have reached the comment limit. Please wait before commenting again." }, { status: 429 });
      const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.commentsTableId, rowId: ID.unique(), data: { post_id: postId, user_id: user.$id, body: content, created_at: new Date().toISOString(), status: "published" } });
      return NextResponse.json({ created: true, comment: { id: String(row.$id), body: content, createdAt: String(row.created_at), mine: true } }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const existing = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.reactionsTableId, queries: [Query.equal("post_id", postId), Query.equal("user_id", user.$id), Query.limit(1)] });
    if (existing.rows[0]) {
      await s.tablesDB.deleteRow({ databaseId: s.databaseId, tableId: s.reactionsTableId, rowId: existing.rows[0].$id });
      const count = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.reactionsTableId, queries: [Query.equal("post_id", postId), Query.limit(100)] });
      return NextResponse.json({ reacted: false, reactionCount: count.rows.length }, { headers: { "Cache-Control": "no-store" } });
    }
    await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.reactionsTableId, rowId: ID.unique(), data: { post_id: postId, user_id: user.$id, reaction: "like", created_at: new Date().toISOString() } });
    const count = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.reactionsTableId, queries: [Query.equal("post_id", postId), Query.limit(100)] });
    return NextResponse.json({ reacted: true, reactionCount: count.rows.length }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community interaction failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The interaction could not be saved. Check the private Appwrite interaction tables." }, { status: 503 });
  }
}
