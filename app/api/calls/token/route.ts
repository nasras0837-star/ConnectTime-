import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { checkMemberAccess } from "@/lib/member-access";
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
    const roomName = String(row.room_name || "");
    if (!/^ct-[0-9a-f-]{36}$/i.test(roomName)) return NextResponse.json({ error: "Call room is invalid." }, { status: 409 });
    const identity = user.$id;
    const token = new AccessToken(apiKey, apiSecret, { identity, name: identity, ttl: "10m" });
    token.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: false });
    const jwt = await token.toJwt();
    return NextResponse.json({ token: jwt, serverUrl: livekitUrl, type: row.call_type === "video" ? "video" : "voice" }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("LiveKit token creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "A secure call token could not be issued." }, { status: 503 });
  }
}
