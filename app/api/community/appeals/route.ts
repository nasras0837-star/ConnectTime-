import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { communitySafetyStore, cleanText, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";


export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to view your appeals." }, { status: 401 });
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_APPEALS_TABLE_ID;
    if (!tableId) throw new Error("Appeals table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("appellant_user_id", user.$id), Query.orderDesc("created_at"), Query.limit(100)] });
    return NextResponse.json({ appeals: result.rows.map(row => ({ id:String(row.$id), status:String(row.status||"received"), createdAt:String(row.created_at||""), reference:String(row.enforcement_reference||"") })) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Your appeals are unavailable or not configured." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before submitting an appeal." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid appeal." }, { status: 400 }); }
  const enforcementReference = cleanText(body.enforcementReference, 180);
  const reason = cleanText(body.reason, 40);
  const details = cleanText(body.details, 3000);
  if (!enforcementReference || !["mistaken-identity", "context-missing", "content-not-violation", "other"].includes(reason) || details.length < 20) {
    return NextResponse.json({ error: "Provide the moderation reference, an appeal reason, and at least 20 characters explaining your appeal." }, { status: 400 });
  }
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_APPEALS_TABLE_ID;
    if (!tableId) throw new Error("Community appeals table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const row = await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: {
      appellant_user_id: user.$id, enforcement_reference: enforcementReference, reason, details,
      status: "received", created_at: new Date().toISOString(),
    } });
    return NextResponse.json({ submitted: true, reference: row.$id, message: "Your appeal was submitted for review. Submission does not automatically reverse the moderation action." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community appeal submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The appeals service is not configured or is temporarily unavailable. Your appeal was not submitted." }, { status: 503 });
  }
}
