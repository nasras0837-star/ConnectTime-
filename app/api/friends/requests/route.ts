import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getServices() {
  const requestTableId = process.env.APPWRITE_FRIEND_REQUESTS_TABLE_ID;
  const profileTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blockTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!requestTableId || !profileTableId || !blockTableId || !endpoint || !projectId || !apiKey || !accessDatabaseId || !accessCollectionId) {
    throw new Error("Friend request storage is not fully configured.");
  }
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, requestTableId, profileTableId, blockTableId, databases, accessDatabaseId, accessCollectionId };
}

async function profileFor(tablesDB: any, databaseId: string, tableId: string, userId: string) {
  try {
    const row = await tablesDB.getRow({ databaseId, tableId, rowId: userId });
    if (!["public", "members"].includes(String(row.visibility))) return null;
    return { handle: String(row.handle || ""), displayName: String(row.display_name || ""), country: String(row.country || "") };
  } catch { return null; }
}

async function isBlocked(tablesDB: any, databaseId: string, tableId: string, first: string, second: string) {
  const [a, b] = await Promise.all([
    tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", first), Query.equal("blocked_user_id", second), Query.limit(1)] }),
    tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("blocker_user_id", second), Query.equal("blocked_user_id", first), Query.limit(1)] })
  ]);
  return a.rows.length > 0 || b.rows.length > 0;
}

async function eligible(databases: Databases, databaseId: string, collectionId: string, userId: string) {
  try {
    const record = await databases.getDocument(databaseId, collectionId, userId);
    return isEligible({ adult_status: record.adult_status, account_status: record.account_status });
  } catch { return false; }
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to manage friend requests." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = await getServices();
    const [incoming, outgoing, fromMe, toMe] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.equal("status", "pending"), Query.orderDesc("$createdAt"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("sender_user_id", user.$id), Query.equal("status", "pending"), Query.orderDesc("$createdAt"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("sender_user_id", user.$id), Query.equal("status", "accepted"), Query.orderDesc("$updatedAt"), Query.limit(100)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.equal("status", "accepted"), Query.orderDesc("$updatedAt"), Query.limit(100)] })
    ]);
    const decorate = async (row: any, direction: "incoming" | "outgoing" | "connection") => {
      const otherId = direction === "incoming" ? String(row.sender_user_id) : String(row.recipient_user_id);
      if (!otherId || await isBlocked(s.tablesDB, s.databaseId, s.blockTableId, user.$id, otherId)) return null;
      if (!await eligible(s.databases, s.accessDatabaseId, s.accessCollectionId, otherId)) return null;
      const profile = await profileFor(s.tablesDB, s.databaseId, s.profileTableId, otherId);
      if (!profile) return null;
      return { id: String(row.$id), direction, status: String(row.status), createdAt: String(row.created_at || ""), profile };
    };
    const [incomingItems, outgoingItems, connectionA, connectionB] = await Promise.all([
      Promise.all(incoming.rows.map(row => decorate(row, "incoming"))),
      Promise.all(outgoing.rows.map(row => decorate(row, "outgoing"))),
      Promise.all(fromMe.rows.map(row => decorate(row, "connection"))),
      Promise.all(toMe.rows.map(row => decorate(row, "incoming")))
    ]);
    const connections = [...connectionA, ...connectionB].filter(Boolean);
    return NextResponse.json({ incoming: incomingItems.filter(Boolean), outgoing: outgoingItems.filter(Boolean), connections }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Friend request listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Friend requests are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before sending a friend request." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid friend request." }, { status: 400 }); }
  const recipientHandle = typeof body.recipientHandle === "string" ? body.recipientHandle.trim().toLowerCase().slice(0, 24) : "";
  if (!/^[a-z0-9_]{3,24}$/.test(recipientHandle)) return NextResponse.json({ error: "Enter a valid member handle." }, { status: 400 });
  try {
    const s = await getServices();
    const matches = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profileTableId, queries: [Query.equal("handle", recipientHandle), Query.limit(2)] });
    if (matches.rows.length !== 1) return NextResponse.json({ error: "This member is not available for connection requests." }, { status: 404 });
    const recipientId = String(matches.rows[0].user_id || "");
    if (!recipientId || recipientId === user.$id) return NextResponse.json({ error: "Choose another member." }, { status: 400 });
    const [recipientEligible, profile, blocked, existingForward, existingReverse] = await Promise.all([
      eligible(s.databases, s.accessDatabaseId, s.accessCollectionId, recipientId),
      profileFor(s.tablesDB, s.databaseId, s.profileTableId, recipientId),
      isBlocked(s.tablesDB, s.databaseId, s.blockTableId, user.$id, recipientId),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("sender_user_id", user.$id), Query.equal("recipient_user_id", recipientId), Query.limit(5)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestTableId, queries: [Query.equal("sender_user_id", recipientId), Query.equal("recipient_user_id", user.$id), Query.limit(5)] })
    ]);
    if (!recipientEligible || !profile || blocked) return NextResponse.json({ error: "This member is not available for connection requests." }, { status: 404 });
    if ([...existingForward.rows, ...existingReverse.rows].some(row => row.status === "accepted")) return NextResponse.json({ error: "You are already connected." }, { status: 409 });
    const pending = existingForward.rows.find(row => row.status === "pending");
    if (pending) return NextResponse.json({ sent: true, alreadyPending: true }, { status: 200 });
    const reversePending = existingReverse.rows.find(row => row.status === "pending");
    if (reversePending) return NextResponse.json({ error: "This member has already sent you a request. Review your incoming requests." }, { status: 409 });
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.requestTableId, rowId: ID.unique(), data: { sender_user_id: user.$id, recipient_user_id: recipientId, status: "pending", created_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    return NextResponse.json({ sent: true, requestId: row.$id }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Friend request creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Friend request storage is unavailable. No request was sent." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to manage requests." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request update." }, { status: 400 }); }
  const requestId = typeof body.requestId === "string" ? body.requestId.trim().slice(0, 128) : "";
  const action = body.action === "accept" || body.action === "decline" ? body.action : "";
  if (!requestId || !action) return NextResponse.json({ error: "Choose a request and a valid action." }, { status: 400 });
  try {
    const s = await getServices();
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.requestTableId, rowId: requestId });
    if (row.recipient_user_id !== user.$id || row.status !== "pending") return NextResponse.json({ error: "This request is no longer available to manage." }, { status: 404 });
    const senderId = String(row.sender_user_id || "");
    if (await isBlocked(s.tablesDB, s.databaseId, s.blockTableId, user.$id, senderId) || !await eligible(s.databases, s.accessDatabaseId, s.accessCollectionId, senderId)) {
      return NextResponse.json({ error: "This connection request is no longer eligible." }, { status: 403 });
    }
    const updated = await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.requestTableId, rowId: requestId, data: { status: action === "accept" ? "accepted" : "declined", updated_at: new Date().toISOString() } });
    return NextResponse.json({ updated: true, status: updated.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Friend request update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Friend request could not be updated." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to cancel requests." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid cancellation request." }, { status: 400 }); }
  const requestId = typeof body.requestId === "string" ? body.requestId.trim().slice(0, 128) : "";
  if (!requestId) return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
  try {
    const s = await getServices();
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.requestTableId, rowId: requestId });
    if (row.sender_user_id !== user.$id || row.status !== "pending") return NextResponse.json({ error: "This request cannot be cancelled." }, { status: 404 });
    await s.tablesDB.deleteRow({ databaseId: s.databaseId, tableId: s.requestTableId, rowId: requestId });
    return NextResponse.json({ cancelled: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Friend request cancellation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Friend request could not be cancelled." }, { status: 503 });
  }
}
