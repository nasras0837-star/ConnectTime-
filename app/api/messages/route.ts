import { NextResponse } from "next/server";
import { Client, Databases, ID, Query, TablesDB } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { isEligible } from "@/lib/access-policy";
import { canViewProfile } from "@/lib/profile-visibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Services = {
  tablesDB: TablesDB;
  databaseId: string;
  messagesTableId: string;
  profilesTableId: string;
  blocksTableId: string;
  requestsTableId: string;
  databases: Databases;
  accessDatabaseId: string;
  accessCollectionId: string;
};

async function services(): Promise<Services> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const messagesTableId = process.env.APPWRITE_MESSAGES_TABLE_ID;
  const profilesTableId = process.env.APPWRITE_PROFILES_TABLE_ID;
  const blocksTableId = process.env.APPWRITE_COMMUNITY_BLOCKS_TABLE_ID;
  const requestsTableId = process.env.APPWRITE_FRIEND_REQUESTS_TABLE_ID;
  const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
  const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
  if (!endpoint || !projectId || !apiKey || !messagesTableId || !profilesTableId || !blocksTableId || !requestsTableId || !accessDatabaseId || !accessCollectionId) {
    throw new Error("Messaging storage is not fully configured.");
  }
  const { tablesDB, databaseId } = communitySafetyStore();
  const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
  return { tablesDB, databaseId, messagesTableId, profilesTableId, blocksTableId, requestsTableId, databases, accessDatabaseId, accessCollectionId };
}

async function eligible(s: Services, userId: string) {
  try {
    const row = await s.databases.getDocument(s.accessDatabaseId, s.accessCollectionId, userId);
    return isEligible({ adult_status: row.adult_status, account_status: row.account_status });
  } catch { return false; }
}

async function blocked(s: Services, a: string, b: string) {
  const [ab, ba] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", a), Query.equal("blocked_user_id", b), Query.limit(1)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.blocksTableId, queries: [Query.equal("blocker_user_id", b), Query.equal("blocked_user_id", a), Query.limit(1)] })
  ]);
  return ab.rows.length > 0 || ba.rows.length > 0;
}

async function profileByHandle(s: Services, handle: string) {
  const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("handle", handle), Query.limit(2)] });
  if (result.rows.length !== 1) return null;
  const row = result.rows[0];
  if (!["public", "members", "friends"].includes(String(row.visibility || ""))) return null;
  const userId = String(row.user_id || "");
  if (!userId) return null;
  return { userId, handle: String(row.handle || ""), displayName: String(row.display_name || row.handle || ""), country: String(row.country || ""), visibility: String(row.visibility || "") };
}

async function connected(s: Services, a: string, b: string) {
  const [ab, ba] = await Promise.all([
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestsTableId, queries: [Query.equal("sender_user_id", a), Query.equal("recipient_user_id", b), Query.equal("status", "accepted"), Query.limit(1)] }),
    s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.requestsTableId, queries: [Query.equal("sender_user_id", b), Query.equal("recipient_user_id", a), Query.equal("status", "accepted"), Query.limit(1)] })
  ]);
  return ab.rows.length > 0 || ba.rows.length > 0;
}

async function peerAccess(s: Services, viewerId: string, peerId: string, visibility: string) {
  if (!peerId || peerId === viewerId) return false;
  const [ok, isBlocked, isConnected] = await Promise.all([
    eligible(s, peerId),
    blocked(s, viewerId, peerId),
    connected(s, viewerId, peerId)
  ]);
  return ok && !isBlocked && isConnected && canViewProfile(visibility, false, isConnected);
}

function messageView(row: Record<string, unknown>, viewerId: string) {
  return {
    id: String(row.$id),
    body: String(row.body || ""),
    createdAt: String(row.created_at || ""),
    mine: row.sender_user_id === viewerId,
    read: row.is_read === true || row.is_read === "true"
  };
}

export async function GET(request: Request) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to use private messages." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = await services();
    const peerHandle = new URL(request.url).searchParams.get("with")?.trim().toLowerCase().slice(0, 24);
    if (peerHandle) {
      if (!/^[a-z0-9_]{3,24}$/.test(peerHandle)) return NextResponse.json({ error: "Enter a valid member handle." }, { status: 400 });
      const peer = await profileByHandle(s, peerHandle);
      if (!peer || !await peerAccess(s, user.$id, peer.userId, peer.visibility)) return NextResponse.json({ error: "Messaging is available only between eligible connections." }, { status: 404 });
      const [sent, received] = await Promise.all([
        s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [Query.equal("sender_user_id", user.$id), Query.equal("recipient_user_id", peer.userId), Query.orderAsc("created_at"), Query.limit(100)] }),
        s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [Query.equal("sender_user_id", peer.userId), Query.equal("recipient_user_id", user.$id), Query.orderAsc("created_at"), Query.limit(100)] })
      ]);
      const rows = [...sent.rows, ...received.rows].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).slice(-100);
      return NextResponse.json({ peer: { handle: peer.handle, displayName: peer.displayName, country: peer.country }, messages: rows.map(row => messageView(row, user.$id)) }, { headers: { "Cache-Control": "no-store" } });
    }
    const [sent, received] = await Promise.all([
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [Query.equal("sender_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(200)] }),
      s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [Query.equal("recipient_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(200)] })
    ]);
    const grouped = new Map<string, Record<string, unknown>[]>();
    for (const row of [...sent.rows, ...received.rows]) {
      const peerId = String(row.sender_user_id === user.$id ? row.recipient_user_id : row.sender_user_id);
      const list = grouped.get(peerId) || [];
      list.push(row);
      grouped.set(peerId, list);
    }
    const conversations = [];
    for (const [peerId, rows] of grouped) {
      const profileRows = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.profilesTableId, queries: [Query.equal("user_id", peerId), Query.limit(1)] });
      const profile = profileRows.rows[0];
      if (!profile || !await peerAccess(s, user.$id, peerId, String(profile.visibility || ""))) continue;
      rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const latest = rows[0];
      conversations.push({
        peer: { handle: String(profile.handle || ""), displayName: String(profile.display_name || profile.handle || ""), country: String(profile.country || "") },
        preview: String(latest.body || "").slice(0, 120),
        updatedAt: String(latest.created_at || ""),
        unreadCount: rows.filter(row => row.recipient_user_id === user.$id && row.sender_user_id === peerId && row.is_read !== true && row.is_read !== "true").length
      });
    }
    conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return NextResponse.json({ conversations }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Private messages listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Private messages are not configured or are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before sending a message." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid message." }, { status: 400 }); }
  const recipientHandle = typeof body.recipientHandle === "string" ? body.recipientHandle.trim().toLowerCase().slice(0, 24) : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  if (!/^[a-z0-9_]{3,24}$/.test(recipientHandle) || !message || message.length > 2000) return NextResponse.json({ error: "Enter a valid recipient and a message of 1–2,000 characters." }, { status: 400 });
  try {
    const s = await services();
    const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [
      Query.equal("sender_user_id", user.$id),
      Query.greaterThanEqual("created_at", new Date(Date.now() - 60_000).toISOString()),
      Query.limit(21)
    ] });
    if (recent.rows.length >= 20) return NextResponse.json({ error: "You are sending messages too quickly. Please wait a minute and try again." }, { status: 429 });
    const peer = await profileByHandle(s, recipientHandle);
    if (!peer || !await peerAccess(s, user.$id, peer.userId)) return NextResponse.json({ error: "You can message only eligible members in your connections." }, { status: 403 });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.messagesTableId, rowId: ID.unique(), data: {
      sender_user_id: user.$id,
      recipient_user_id: peer.userId,
      body: message,
      is_read: false,
      created_at: now
    }});
    const notificationsTableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
    if (notificationsTableId) {
      try {
        const settingsTableId = process.env.APPWRITE_MEMBER_SETTINGS_TABLE_ID;
        if (settingsTableId) {
          try {
            const preferences = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: settingsTableId, rowId: peer.userId });
            if (preferences.user_id === peer.userId && (preferences.private_messages === false || preferences.private_messages === "false")) {
              return NextResponse.json({ sent: true, message: messageView(row, user.$id), notificationSuppressed: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
            }
          } catch (error) {
            if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
          }
        }
        await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: notificationsTableId, rowId: ID.unique(), data: {
          recipient_user_id: peer.userId,
          actor_user_id: user.$id,
          type: "new_message",
          message: "You received a new private message.",
          reference_id: String(row.$id),
          is_read: false,
          created_at: now
        }});
      } catch (error) { console.error("Message notification could not be saved", error instanceof Error ? error.message : "unknown"); }
    }
    return NextResponse.json({ sent: true, message: messageView(row, user.$id) }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Private message send failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Message storage is unavailable. No message was sent." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to update messages." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid message update." }, { status: 400 }); }
  const peerHandle = typeof body.peerHandle === "string" ? body.peerHandle.trim().toLowerCase().slice(0, 24) : "";
  if (!/^[a-z0-9_]{3,24}$/.test(peerHandle)) return NextResponse.json({ error: "A valid member handle is required." }, { status: 400 });
  try {
    const s = await services();
    const peer = await profileByHandle(s, peerHandle);
    if (!peer || !await peerAccess(s, user.$id, peer.userId)) return NextResponse.json({ error: "Conversation is not available." }, { status: 404 });
    const unread = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.messagesTableId, queries: [Query.equal("sender_user_id", peer.userId), Query.equal("recipient_user_id", user.$id), Query.equal("is_read", false), Query.limit(100)] });
    await Promise.all(unread.rows.map(row => s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.messagesTableId, rowId: String(row.$id), data: { is_read: true } })));
    return NextResponse.json({ updated: unread.rows.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Private message read update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Messages could not be marked as read." }, { status: 503 });
  }
}
