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

async function notifyDatingUser(tablesDB: ReturnType<typeof communitySafetyStore>["tablesDB"], databaseId: string, recipientId: string, actorId: string, message: string, referenceId: string) {
  const tableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
  if (!tableId) return;
  const settingsTableId = process.env.APPWRITE_MEMBER_SETTINGS_TABLE_ID;
  if (settingsTableId) {
    try {
      const preferences = await tablesDB.getRow({ databaseId, tableId: settingsTableId, rowId: recipientId });
      if (preferences.user_id === recipientId && (preferences.dating_likes === false || preferences.dating_likes === "false")) return;
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) {
        console.error("Dating notification preferences could not be checked", error instanceof Error ? error.message : "unknown");
        return;
      }
    }
  }
  try {
    await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: {
      recipient_user_id: recipientId,
      actor_user_id: actorId,
      type: "dating_like",
      message: message.slice(0, 180),
      reference_id: referenceId.slice(0, 128),
      is_read: false,
      created_at: new Date().toISOString()
    }});
  } catch (error) {
    console.error("Dating notification could not be saved", error instanceof Error ? error.message : "unknown");
  }
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view dating likes." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = tables();
    const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
    const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!accessDatabaseId || !accessCollectionId || !endpoint || !projectId || !apiKey) throw new Error("Member eligibility storage is not configured.");
    const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
    const [receivedRows, sentRows, outgoingBlocks, incomingBlocks] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.likesTableId, queries: [Query.equal("sender_user_id", user.$id), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", user.$id), Query.limit(500)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocked_user_id", user.$id), Query.limit(500)] })
    ]);
    const blocked = new Set([
      ...outgoingBlocks.rows.map(row => String(row.blocked_user_id || "")),
      ...incomingBlocks.rows.map(row => String(row.blocker_user_id || ""))
    ]);
    const senderIds = [...new Set(receivedRows.rows.map(row => String(row.sender_user_id || "")).filter(Boolean))];
    const sentIds = [...new Set(sentRows.rows.map(row => String(row.recipient_user_id || "")).filter(Boolean))];
    const allIds = [...new Set([...senderIds, ...sentIds])].filter(id => !blocked.has(id));
    const profileRows = allIds.length ? await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", allIds), Query.limit(200)] }) : { rows: [] };
    const profiles = new Map(profileRows.rows.map(row => [String(row.user_id), row]));
    const eligibleIds = new Set<string>();
    await Promise.all(allIds.map(async id => {
      try {
        const record = await databases.getDocument(accessDatabaseId, accessCollectionId, id);
        if (isEligible({ adult_status: record.adult_status, account_status: record.account_status })) eligibleIds.add(id);
      } catch { /* Missing eligibility records remain hidden. */ }
    }));
    const visibleProfile = (id: string) => {
      const row = profiles.get(id);
      if (!row || !eligibleIds.has(id) || !["public", "members"].includes(String(row.visibility)) || Number(row.age || 0) < 18 || !row.gender) return null;
      return {
        handle: String(row.handle || ""),
        displayName: String(row.display_name || row.handle || ""),
        country: String(row.country || ""),
        age: Number(row.age || 0),
        gender: String(row.gender || ""),
        interests: String(row.interests || "").split(",").map((item: string) => item.trim()).filter(Boolean)
      };
    };
    const incoming = receivedRows.rows.flatMap(row => {
      const senderId = String(row.sender_user_id || "");
      const profile = visibleProfile(senderId);
      if (!profile || !profile.handle) return [];
      const mutual = sentIds.includes(senderId);
      return [{ id: String(row.$id), createdAt: String(row.created_at || ""), profile, matched: mutual }];
    });
    const sent = sentIds.map(id => visibleProfile(id)).filter((profile): profile is NonNullable<ReturnType<typeof visibleProfile>> => !!profile);
    const matches = incoming.filter(item => item.matched);
    return NextResponse.json({ received: incoming, sent, matches }, { headers: { "Cache-Control": "no-store" } });
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
    const created = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.likesTableId, rowId: ID.unique(), data: { sender_user_id: user.$id, recipient_user_id: String(target.user_id), created_at: new Date().toISOString() } });
    const matched = reciprocal.rows.length > 0;
    if (matched) {
      await Promise.all([
        notifyDatingUser(s.tablesDB, s.databaseId, String(target.user_id), user.$id, "You have a new mutual dating match!", String(created.$id)),
        notifyDatingUser(s.tablesDB, s.databaseId, user.$id, String(target.user_id), "You have a new mutual dating match!", String(created.$id))
      ]);
    } else {
      await notifyDatingUser(s.tablesDB, s.databaseId, String(target.user_id), user.$id, "Someone liked your dating profile.", String(created.$id));
    }
    return NextResponse.json({ liked: true, matched }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dating like failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The like could not be sent. Dating storage may need configuration." }, { status: 503 });
  }
}


export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to manage dating likes." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid like update." }, { status: 400 }); }
  const likeId = typeof body.likeId === "string" ? body.likeId.trim().slice(0, 128) : "";
  if (!likeId) return NextResponse.json({ error: "Choose a like to dismiss." }, { status: 400 });
  try {
    const s = tables();
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.likesTableId, rowId: likeId });
    if (String(row.recipient_user_id) !== user.$id) return NextResponse.json({ error: "This like is not available to dismiss." }, { status: 404 });
    await s.tablesDB.deleteRow({ databaseId: s.databaseId, tableId: s.likesTableId, rowId: likeId });
    return NextResponse.json({ dismissed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dating like dismissal failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "This like could not be dismissed." }, { status: 503 });
  }
}
