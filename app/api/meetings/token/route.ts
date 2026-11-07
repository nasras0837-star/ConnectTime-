import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { checkMemberAccess } from "@/lib/member-access";
import { currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(payload: Record<string, unknown>, secret: string) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  const unsigned = header + "." + body;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return unsigned + "." + signature;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const member = await currentCommunityMember();
  if (!member) return NextResponse.json({ error: "Sign in to start or join a meeting." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership with an active account is required." }, { status: access.status });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid meeting request." }, { status: 400 }); }
  const requestedRoom = typeof body.roomName === "string" ? body.roomName.trim() : "";
  const roomName = requestedRoom || "ct-" + randomBytes(24).toString("hex");
  if (!/^ct-[a-f0-9]{48}$/.test(roomName)) return NextResponse.json({ error: "That meeting invitation is invalid. Ask the host for a new link." }, { status: 400 });

  const serverUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!serverUrl || !apiKey || !apiSecret) return NextResponse.json({ error: "Group meetings are not connected yet. The meeting service must be configured by ConnectTime." }, { status: 503 });
  if (!/^wss:\/\//i.test(serverUrl)) return NextResponse.json({ error: "The meeting service URL must use a secure WebSocket connection." }, { status: 503 });

  const now = Math.floor(Date.now() / 1000);
  const identity = member.$id + "-" + randomBytes(8).toString("hex");
  const displayName = (typeof member.name === "string" ? member.name : "ConnectTime member").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 80) || "ConnectTime member";
  const token = signToken({
    iss: apiKey,
    sub: identity,
    name: displayName,
    nbf: now - 5,
    iat: now,
    exp: now + 2 * 60 * 60,
    video: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true }
  }, apiSecret);

  return NextResponse.json({
    roomName,
    serverUrl,
    token,
    expiresInSeconds: 7200,
    invitePath: "/meetings?room=" + roomName
  }, { headers: { "Cache-Control": "no-store, private" } });
}
