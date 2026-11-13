import { NextResponse } from "next/server";
import { AccessToken, TrackSource, type VideoGrant } from "livekit-server-sdk";
import { checkMemberAccess } from "@/lib/member-access";
import { Client, Databases, Query } from "node-appwrite";
import { isEligible } from "@/lib/access-policy";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.ONE_TO_ONE_CALLS_ENABLED !== "true") return NextResponse.json({ error: "One-to-one calling is not enabled on this deployment yet." }, { status: 503 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to join this call." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid token request." }, { status: 400 }); }
  const callId = typeof body.callId === "string" ? body.callId.trim().slice(0, 128) : "";
  if (!callId) return NextResponse.json({ error: "Call ID is required." }, { status: 400 });
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!livekitUrl || !apiKey || !apiSecret) return NextResponse.json({ error: "LiveKit is not configured on this deployment." }, { status: 503 });
  try {
    const callsTableId = process.env.APPWRITE_CALLS_TABLE_ID;
    if (!callsTableId) throw new Error("Call table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const row = await tablesDB.getRow({ databaseId, tableId: callsTableId, rowId: callId });
    const callerId = String(row.caller_user_id || "");
    const recipientId = String(row.recipient_user_id || "");
    if ((user.$id !== callerId && user.$id !== recipientId) || row.status !== "accepted") return NextResponse.json({ error: "This call is not available to join." }, { status: 403 });
    const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
    const friendsTableId = process.env.APPWRITE_FRIEND_REQUESTS_TABLE_ID;
    const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
    const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    if (!blocksTableId || !friendsTableId || !accessDatabaseId || !accessCollectionId || !endpoint || !projectId || !apiKey) throw new Error("Call authorization dependencies are not configured.");
    const [blockedForward, blockedReverse, connectedForward, connectedReverse] = await Promise.all([
      tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocker_user_id", callerId), Query.equal("blocked_user_id", recipientId), Query.limit(1)] }),
      tablesDB.listRows({ databaseId, tableId: blocksTableId, queries: [Query.equal("blocker_user_id", recipientId), Query.equal("blocked_user_id", callerId), Query.limit(1)] }),
      tablesDB.listRows({ databaseId, tableId: friendsTableId, queries: [Query.equal("sender_user_id", callerId), Query.equal("recipient_user_id", recipientId), Query.equal("status", "accepted"), Query.limit(1)] }),
      tablesDB.listRows({ databaseId, tableId: friendsTableId, queries: [Query.equal("sender_user_id", recipientId), Query.equal("recipient_user_id", callerId), Query.equal("status", "accepted"), Query.limit(1)] }),
    ]);
    if (blockedForward.rows.length || blockedReverse.rows.length || (!connectedForward.rows.length && !connectedReverse.rows.length)) return NextResponse.json({ error: "This call is no longer available." }, { status: 403 });
    const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
    try {
      const peerAccess = await databases.getDocument(accessDatabaseId, accessCollectionId, user.$id === callerId ? recipientId : callerId);
      if (!isEligible({ adult_status: peerAccess.adult_status, account_status: peerAccess.account_status })) return NextResponse.json({ error: "The other participant is no longer eligible to call." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "The other participant is no longer eligible to call." }, { status: 403 });
    }
    const roomName = String(row.room_name || "");
    if (!/^ct-[0-9a-f-]{36}$/i.test(roomName)) return NextResponse.json({ error: "Call room is invalid." }, { status: 409 });
    const identity = `${user.$id}:${callId}`;
    const token = new AccessToken(apiKey, apiSecret, { identity, name: identity, ttl: "10m" });
    const grant: VideoGrant = {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      canPublishSources: row.call_type === "video" ? [TrackSource.MICROPHONE, TrackSource.CAMERA] : [TrackSource.MICROPHONE],
    };
    token.addGrant(grant);
    const jwt = await token.toJwt();
    return NextResponse.json({ token: jwt, serverUrl: livekitUrl, type: row.call_type === "video" ? "video" : "voice" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("LiveKit token creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "A secure call token could not be issued." }, { status: 503 });
  }
}
