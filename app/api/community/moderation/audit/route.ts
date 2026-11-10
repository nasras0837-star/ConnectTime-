import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { communitySafetyStore, currentCommunityMember } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to access audit records." }, { status: 401 });
  const moderators = new Set((process.env.APPWRITE_MODERATOR_USER_IDS || "").split(",").map(v => v.trim()).filter(Boolean));
  if (!moderators.size || !moderators.has(user.$id)) return NextResponse.json({ error: "Moderator access is required." }, { status: 403 });
  const tableId = process.env.APPWRITE_MODERATION_AUDIT_TABLE_ID;
  if (!tableId) return NextResponse.json({ error: "Moderation audit is not configured." }, { status: 503 });
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.orderDesc("created_at"), Query.limit(200)] });
    return NextResponse.json({ events: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Audit records are unavailable." }, { status: 503 });
  }
}
