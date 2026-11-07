import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { isEligible } from "@/lib/access-policy";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tables() {
  const likesTableId = process.env.APPWRITE_DATING_LIKES_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  if (!likesTableId || !profilesTableId || !blocksTableId) throw new Error("Dating likes storage is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, likesTableId, profilesTableId, blocksTableId };
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view dating likes." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = tables();
    const [received, sent] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("sender_user_id", user.$id), Query.limit(100)] })
    ]);
    const sentUserIds = [...new Set(sent.rows.map(row => String(row.recipient_user_id)))];
    const sentProfiles = sentUserIds.length ? await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", sentUserIds), Query.limit(100)] }) : { rows: [] };
    return NextResponse.json({
      received: received.rows.map(row => ({ id: String(row.$id), senderUserId: String(row.sender_user_id), createdAt: String(row.created_at || "") })),
      sent: sentProfiles.rows.map(row => String(row.handle || "")).filter(Boolean)
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dating likes lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Dating likes are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to send a like." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid like request." }, { status: 400 }); }
  const recipientHandle = typeof body.recipientHandle === "string" ? body.recipientHandle.trim().toLowerCase() : "";
  if (!/^[a-z0-9_]{3,24}$/.test(recipientHandle)) return NextResponse.json({ error: "Choose a valid member profile." }, { status: 400 });
  try {
    const s = tables();
    const matches = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("handle", [recipientHandle]), Query.limit(1)] });
    const target = matches.rows[0];
    if (!target || !target.user_id || target.user_id === user.$id || !["public", "members"].includes(String(target.visibility))) return NextResponse.json({ error: "That member is not available for dating." }, { status: 404 });
    const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
    const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!accessDatabaseId || !accessCollectionId || !endpoint || !projectId || !apiKey) throw new Error("Member eligibility storage is not configured.");
    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
    const eligibility = await new Databases(client).getDocument(accessDatabaseId, accessCollectionId, String(target.user_id));
    if (!isEligible({ adult_status: eligibility.adult_status, account_status: eligibility.account_status })) return NextResponse.json({ error: "That member is not eligible for dating." }, { status: 403 });
    const [outgoingBlock, incomingBlock, existing, reciprocal] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", user.$id), Query.equal("blocked_user_id", String(target.user_id)), Query.limit(1)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", String(target.user_id)), Query.equal("blocked_user_id", user.$id), Query.limit(1)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("sender_user_id", user.$id), Query.equal("recipient_user_id", String(target.user_id)), Query.limit(1)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("sender_user_id", String(target.user_id)), Query.equal("recipient_user_id", user.$id), Query.limit(1)] })
    ]);
    if (outgoingBlock.rows.length || incomingBlock.rows.length) return NextResponse.json({ error: "This profile is unavailable." }, { status: 403 });
    if (existing.rows.length) return NextResponse.json({ liked: true, alreadyLiked: true, matched: reciprocal.rows.length > 0 });
    await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.likesTableId, rowId: ID.unique(), data: { sender_user_id: user.$id, recipient_user_id: String(target.user_id), created_at: new Date().toISOString() } });
    return NextResponse.json({ liked: true, matched: reciprocal.rows.length > 0 }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dating like failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The like could not be sent. Dating storage may need configuration." }, { status: 503 });
  }
}
