import { NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RING_SECONDS = 45;
const ACTIVE_STATUSES = ["ringing", "accepted"] as const;

async function services() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const callsTableId = process.env.APPWRITE_CALLS_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const friendsTableId = process.env.APPWRITE_FRIEND_REQUESTS_TABLE_ID;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !callsTableId || !profilesTableId || !blocksTableId || !friendsTableId || !accessDatabaseId || !accessCollectionId) {
    throw new Error("Calling storage is not fully configured.");
  }
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, databases, callsTableId, profilesTableId, blocksTableId, friendsTableId, accessDatabaseId, accessCollectionId };
}

async function eligible(s: Awaited<ReturnType<typeof services>>, userId: string) {
  try {
    const row = await s.databases.getDocument(s.accessDatabaseId, s.accessCollectionId, userId);
    return isEligible({ adult_status: row.adult_status, account_status: row.account_status });
  } catch { return false; }
}

async function blocked(s: Awaited<ReturnType<typeof services>>, a: string, b: string) {
  const [ab, ba] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", a), Query.equal("blocked_user_id", b), Query.limit(1)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", b), Query.equal("blocked_user_id", a), Query.limit(1)] }),
  ]);
  return ab.rows.length > 0 || ba.rows.length > 0;
}

async function connected(s: Awaited<ReturnType<typeof services>>, a: string, b: string) {
  const [ab, ba] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.friendsTableId, queries: [Query.equal("sender_user_id", a), Query.equal("recipient_user_id", b), Query.equal("status", "accepted"), Query.limit(1)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.friendsTableId, queries: [Query.equal("sender_user_id", b), Query.equal("recipient_user_id", a), Query.equal("status", "accepted"), Query.limit(1)] }),
  ]);
  return ab.rows.length > 0 || ba.rows.length > 0;
}

async function profileByHandle(s: Awaited<ReturnType<typeof services>>, handle: string) {
  const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("handle", handle), Query.limit(2)] });
  if (result.rows.length !== 1) return null;
  const row = result.rows[0];
  const userId = String(row.user_id || "");
  if (!userId || !["public", "members"].includes(String(row.visibility || ""))) return null;
  return { userId, handle: String(row.handle || ""), displayName: String(row.display_name || row.handle || "") };
}

function callView(row: Record<string, unknown>, viewerId: string) {
  return {
    id: String(row.$id),
    type: row.call_type === "video" ? "video" : "voice",
    status: String(row.status || ""),
    expiresAt: String(row.expires_at || ""),
    createdAt: String(row.created_at || ""),
    outgoing: row.caller_user_id === viewerId,
    peerHandle: String(row.caller_user_id === viewerId ? row.recipient_handle || "" : row.caller_handle || ""),
    peerName: String(row.caller_user_id === viewerId ? row.recipient_name || "" : row.caller_name || ""),
  };
}

function enabled() {
  return process.env.ONE_TO_ONE_CALLS_ENABLED === "true";
}

export async function GET() {
  if (!enabled()) return NextResponse.json({ error: "One-to-one calling is not enabled on this deployment yet." }, { status: 503 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to use calls." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = await services();
    const [incoming, outgoing] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.callsTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.equal("status", [...ACTIVE_STATUSES]), Query.orderDesc("created_at"), Query.limit(20)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.callsTableId, queries: [Query.equal("caller_user_id", user.$id), Query.equal("status", [...ACTIVE_STATUSES]), Query.orderDesc("created_at"), Query.limit(20)] }),
    ]);
    const now = Date.now();
    const live = (row: Record<string, unknown>) => Date.parse(String(row.expires_at || "")) > now || row.status === "accepted";
    return NextResponse.json({
      incomingCalls: incoming.rows.filter(live).map(row => callView(row, user.$id)),
      outgoingCalls: outgoing.rows.filter(live).map(row => callView(row, user.$id)),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Call listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Calling is not configured or is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "One-to-one calling is not enabled on this deployment yet." }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before starting a call." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid call request." }, { status: 400 }); }
  const handle = typeof body.recipientHandle === "string" ? body.recipientHandle.trim().toLowerCase().slice(0, 24) : "";
  const type = body.type === "video" ? "video" : body.type === "voice" ? "voice" : "";
  if (!/^[a-z0-9_]{3,24}$/.test(handle) || !type) return NextResponse.json({ error: "Choose a valid member and call type." }, { status: 400 });
  try {
    const s = await services();
    const profile = await profileByHandle(s, handle);
    if (!profile || profile.userId === user.$id) return NextResponse.json({ error: "This member is not available for calls." }, { status: 404 });
    const [peerEligible, isBlocked, isConnected, recent, current] = await Promise.all([
      eligible(s, profile.userId),
      blocked(s, user.$id, profile.userId),
      connected(s, user.$id, profile.userId),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.callsTableId, queries: [Query.equal("caller_user_id", user.$id), Query.greaterThanEqual("created_at", new Date(Date.now() - 10 * 60_000).toISOString()), Query.limit(20)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.callsTableId, queries: [Query.equal("caller_user_id", user.$id), Query.equal("status", "ringing"), Query.orderDesc("created_at"), Query.limit(5)] }),
    ]);
    if (!peerEligible || isBlocked || !isConnected) return NextResponse.json({ error: "Calls are available only between eligible, connected members who have not blocked each other." }, { status: 403 });
    if (recent.rows.length >= 5) return NextResponse.json({ error: "You have started too many calls. Please wait before trying again." }, { status: 429 });
    if (current.rows.some(row => Date.parse(String(row.expires_at || "")) > Date.now())) return NextResponse.json({ error: "You already have an outgoing call ringing." }, { status: 409 });
    const ownProfileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", user.$id), Query.limit(1)] });
    const ownProfile = ownProfileRows.rows[0];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RING_SECONDS * 1000).toISOString();
    const row = await s.tablesDB.createRow({
      databaseId: s.databaseId,
      tableId: s.callsTableId,
      rowId: ID.unique(),
      data: {
        caller_user_id: user.$id,
        recipient_user_id: profile.userId,
        caller_handle: String(ownProfile?.handle || ""),
        caller_name: String(ownProfile?.display_name || ownProfile?.handle || "Connect member"),
        recipient_handle: profile.handle,
        recipient_name: profile.displayName,
        call_type: type,
        room_name: `ct-${crypto.randomUUID()}`,
        status: "ringing",
        expires_at: expiresAt,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    });
    const notificationTableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
    if (notificationTableId) {
      try {
        await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: notificationTableId, rowId: ID.unique(), data: {
          recipient_user_id: profile.userId, actor_user_id: user.$id, type: "incoming_call",
          message: type === "video" ? "You have an incoming video call." : "You have an incoming voice call.",
          reference_id: String(row.$id), is_read: false, created_at: now.toISOString(),
        }});
      } catch (error) { console.error("Incoming call notification could not be saved", error instanceof Error ? error.message : "unknown"); }
    }
    return NextResponse.json({ call: callView(row, user.$id) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Call creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Call could not be started. Calling storage may not be configured." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!enabled()) return NextResponse.json({ error: "One-to-one calling is not enabled on this deployment yet." }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to manage calls." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid call update." }, { status: 400 }); }
  const callId = typeof body.callId === "string" ? body.callId.trim().slice(0, 128) : "";
  const action = body.action === "accept" || body.action === "decline" || body.action === "end" ? body.action : "";
  if (!callId || !action) return NextResponse.json({ error: "A call and valid action are required." }, { status: 400 });
  try {
    const s = await services();
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.callsTableId, rowId: callId });
    const callerId = String(row.caller_user_id || "");
    const recipientId = String(row.recipient_user_id || "");
    if (user.$id !== callerId && user.$id !== recipientId) return NextResponse.json({ error: "Call not found." }, { status: 404 });
    const status = String(row.status || "");
    if (action === "accept") {
      if (user.$id !== recipientId || status !== "ringing" || Date.parse(String(row.expires_at || "")) <= Date.now()) return NextResponse.json({ error: "This call is no longer available to accept." }, { status: 409 });
      if (await blocked(s, callerId, recipientId) || !await eligible(s, callerId)) return NextResponse.json({ error: "This call is no longer authorized." }, { status: 403 });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.callsTableId, rowId: callId, data: { status: "accepted", accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    } else if (action === "decline") {
      if (user.$id !== recipientId || status !== "ringing") return NextResponse.json({ error: "This call cannot be declined." }, { status: 409 });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.callsTableId, rowId: callId, data: { status: "declined", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    } else {
      if (status !== "accepted" && status !== "ringing") return NextResponse.json({ ended: true, status });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.callsTableId, rowId: callId, data: { status: "ended", ended_at: new Date().toISOString(), updated_at: new Date().toISOString() } });
    }
    return NextResponse.json({ updated: true, action }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Call update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Call state could not be updated." }, { status: 503 });
  }
}
