import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { communitySafetyStore, currentCommunityMember, sameOrigin, cleanText } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function moderator(request?: Request) {
  const user = await currentCommunityMember();
  if (!user) return { response: NextResponse.json({ error: "Sign in to access moderation." }, { status: 401 }) };
  const allowlist = new Set((process.env.APPWRITE_MODERATOR_USER_IDS || "").split(",").map(v => v.trim()).filter(Boolean));
  if (!allowlist.size || !allowlist.has(user.$id)) return { response: NextResponse.json({ error: "Moderator access is required." }, { status: 403 }) };
  return { user };
}

function config() {
  const tableId = process.env.APPWRITE_COMMUNITY_APPEALS_TABLE_ID;
  if (!tableId) throw new Error("Appeals table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

export async function GET(request: Request) {
  const auth = await moderator();
  if ("response" in auth) return auth.response;
  try {
    const { tablesDB, databaseId, tableId } = config();
    const status = cleanText(new URL(request.url).searchParams.get("status"), 30);
    const valid = ["received", "reviewing", "upheld", "overturned", "dismissed"];
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [
      ...(valid.includes(status) ? [Query.equal("status", status)] : []),
      Query.orderDesc("created_at"), Query.limit(100),
    ]});
    return NextResponse.json({ appeals: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The appeals queue is not configured or is unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const auth = await moderator();
  if ("response" in auth) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid appeal decision." }, { status: 400 }); }
  const appealId = cleanText(body.appealId, 128);
  const status = cleanText(body.status, 30);
  const note = cleanText(body.reviewNote, 1000);
  if (!appealId || !["reviewing", "upheld", "overturned", "dismissed"].includes(status) || (status !== "reviewing" && note.length < 10)) {
    return NextResponse.json({ error: "Choose a valid appeal status and provide at least 10 characters of review notes for a final decision." }, { status: 400 });
  }
  try {
    const s = config();
    const existing = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: appealId });
    if (["upheld", "overturned", "dismissed"].includes(String(existing.status))) return NextResponse.json({ error: "This appeal has already received a final decision." }, { status: 409 });
    const updated = await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: appealId, data: {
      status, reviewer_user_id: auth.user.$id, reviewed_at: new Date().toISOString(), review_note: note,
    }});
    return NextResponse.json({ updated: true, appeal: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The appeal decision could not be saved. Check the Appwrite schema and permissions." }, { status: 503 });
  }
}
