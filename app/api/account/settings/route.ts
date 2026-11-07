import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaults = { friend_requests: true, friend_acceptances: true, private_messages: true, dating_likes: true, product_updates: false };

function settingsTable() {
  const tableId = process.env.APPWRITE_MEMBER_SETTINGS_TABLE_ID;
  if (!tableId) throw new Error("Member settings table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view account settings." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = settingsTable();
    const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
    if (row.user_id !== user.$id) return NextResponse.json({ error: "Settings ownership check failed." }, { status: 403 });
    return NextResponse.json({ settings: Object.fromEntries(Object.keys(defaults).map(key => [key, row[key] === true || row[key] === "true"])) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 404) return NextResponse.json({ settings: defaults }, { headers: { "Cache-Control": "no-store" } });
    console.error("Account settings lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Account settings are unavailable. Check the private Appwrite settings table." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before saving settings." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid settings." }, { status: 400 }); }
  const data = Object.fromEntries(Object.keys(defaults).map(key => [key, typeof body[key] === "boolean" ? body[key] : defaults[key as keyof typeof defaults]]));
  try {
    const s = settingsTable();
    const now = new Date().toISOString();
    try {
      const existing = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
      if (existing.user_id !== user.$id) return NextResponse.json({ error: "Settings ownership check failed." }, { status: 403 });
      const row = await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id, data: { ...data, updated_at: now } });
      return NextResponse.json({ saved: true, settings: data, updatedAt: row.updated_at }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
    }
    await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: ID.custom(user.$id), data: { user_id: user.$id, ...data, created_at: now, updated_at: now } });
    return NextResponse.json({ saved: true, settings: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Account settings save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Settings could not be saved. Check the Appwrite table columns." }, { status: 503 });
  }
}
