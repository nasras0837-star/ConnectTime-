import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view notifications." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const tableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
  if (!tableId) return NextResponse.json({ error: "Notifications are not configured yet." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("recipient_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(100)] });
    const notifications = result.rows.map(row => ({
      id: String(row.$id),
      type: String(row.type || "activity"),
      message: String(row.message || "You have a new notification."),
      createdAt: String(row.created_at || ""),
      read: row.is_read === true || row.is_read === "true",
      referenceId: String(row.reference_id || "")
    }));
    return NextResponse.json({ notifications, unreadCount: notifications.filter(item => !item.read).length }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Notifications listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Notifications are temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to update notifications." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  const tableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
  if (!tableId) return NextResponse.json({ error: "Notifications are not configured yet." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid notification update." }, { status: 400 }); }
  const notificationId = typeof body.notificationId === "string" ? body.notificationId.trim().slice(0, 128) : "";
  if (!notificationId) return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const row = await tablesDB.getRow({ databaseId, tableId, rowId: notificationId });
    if (row.recipient_user_id !== user.$id) return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    await tablesDB.updateRow({ databaseId, tableId, rowId: notificationId, data: { is_read: true } });
    return NextResponse.json({ updated: true, read: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Notification update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Notification could not be updated." }, { status: 503 });
  }
}
