import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
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


async function auditAppeal(event: { moderator_user_id: string; appellant_user_id: string; appeal_id: string; outcome: string; note: string; created_at: string }) {
  const tableId = process.env.APPWRITE_MODERATION_AUDIT_TABLE_ID;
  if (!tableId) { console.error("Moderation audit table is not configured."); return; }
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: {
      moderator_user_id: event.moderator_user_id, event_type: "appeal_decision",
      target_user_id: event.appellant_user_id, report_id: event.appeal_id,
      action: "appeal_review", outcome: event.outcome, note: event.note, created_at: event.created_at,
    }});
  } catch (error) { console.error("Appeal audit write failed", error instanceof Error ? error.message : "unknown"); }
}
async function notifyAppellant(userId: string, appealId: string, outcome: string, createdAt: string) {
  const tableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
  if (!tableId) { console.error("Moderation notification table is not configured."); return; }
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    const messages: Record<string,string> = { upheld: "Your Connect appeal was reviewed. The original moderation decision remains in place.", overturned: "Your Connect appeal was reviewed and the original decision was overturned. Contact support if you need assistance.", dismissed: "Your Connect appeal was reviewed and dismissed." };
    await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: {
      recipient_user_id: userId, type: "appeal", message: messages[outcome] || "Your Connect appeal is being reviewed.",
      reference_id: appealId, is_read: false, created_at: createdAt,
    }});
  } catch (error) { console.error("Appeal notification write failed", error instanceof Error ? error.message : "unknown"); }
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


export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const auth = await moderator();
  if ("response" in auth) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid restoration request." }, { status: 400 }); }
  const appealId = cleanText(body.appealId, 128);
  const restore = cleanText(body.restore, 30);
  const note = cleanText(body.note, 1000);
  if (!appealId || restore !== "restore_content" || note.length < 20) return NextResponse.json({ error: "Choose a restoration action and provide at least 20 characters of justification." }, { status: 400 });
  try {
    const s = config();
    const appeal = await s.tablesDB.getRow({ databaseId:s.databaseId, tableId:s.tableId, rowId:appealId });
    if (appeal.status !== "overturned") return NextResponse.json({ error:"Only overturned appeals may request a restoration action." }, { status:409 });
    const reportId = String(appeal.enforcement_reference || "");
    const reportTable = process.env.APPWRITE_COMMUNITY_REPORTS_TABLE_ID;
    if (!reportId || !reportTable) return NextResponse.json({ error:"The original enforcement report cannot be verified." }, {status:409});
    const report = await s.tablesDB.getRow({databaseId:s.databaseId,tableId:reportTable,rowId:reportId});
    if (report.reported_user_id !== appeal.appellant_user_id) return NextResponse.json({error:"Appeal and enforcement target do not match."},{status:409});
    const now = new Date().toISOString();
    if (report.action_taken !== "remove_content" || report.target_type !== "post" || !report.content_reference) return NextResponse.json({error:"This appeal does not reference a removable community post."},{status:409});
    const postTables=[process.env.APPWRITE_COMMUNITY_POSTS_TABLE_ID,process.env.APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID].filter((v):v is string=>Boolean(v));
    let restored=false;
    for(const tableId of postTables){try{const post=await s.tablesDB.getRow({databaseId:s.databaseId,tableId,rowId:String(report.content_reference)});const priorStatus=String(report.previous_content_status||"");if(post.author_user_id!==appeal.appellant_user_id||post.status!=="removed"||!priorStatus||priorStatus==="removed"||priorStatus.length>30)return NextResponse.json({error:"Post owner, current status, or recorded prior status does not match this enforcement. No restoration occurred."},{status:409});await s.tablesDB.updateRow({databaseId:s.databaseId,tableId,rowId:String(post.$id),data:{status:priorStatus,updated_at:now}});restored=true;break;}catch(e){if(!(typeof e==="object"&&e!==null&&"code"in e&&e.code===404))throw e;}}
    if(!restored)return NextResponse.json({error:"Original removed post not found."},{status:404});
    await auditAppeal({moderator_user_id:auth.user.$id,appellant_user_id:String(appeal.appellant_user_id),appeal_id:appealId,outcome:"restoration_"+restore,note,created_at:now});
    await notifyAppellant(String(appeal.appellant_user_id),appealId,"overturned",now);
    return NextResponse.json({restored:true,action:restore},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { console.error("Appeal restoration failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Restoration could not be completed. Verify the appeal, report, and access schema."},{status:503});}
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
    const now = new Date().toISOString();
    await auditAppeal({ moderator_user_id: auth.user.$id, appellant_user_id: String(existing.appellant_user_id || ""), appeal_id: appealId, outcome: status, note, created_at: now });
    if (["upheld", "overturned", "dismissed"].includes(status) && typeof existing.appellant_user_id === "string" && existing.appellant_user_id) await notifyAppellant(existing.appellant_user_id, appealId, status, now);
    return NextResponse.json({ updated: true, appeal: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The appeal decision could not be saved. Check the Appwrite schema and permissions." }, { status: 503 });
  }
}
