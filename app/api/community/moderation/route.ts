import { NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { communitySafetyStore, currentCommunityMember, sameOrigin, cleanText } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function moderatorIds() {
  return new Set((process.env.APPWRITE_MODERATOR_USER_IDS || "").split(",").map(value => value.trim()).filter(Boolean));
}

async function requireModerator() {
  const user = await currentCommunityMember();
  if (!user) return { response: NextResponse.json({ error: "Sign in to access moderation." }, { status: 401 }) };
  const allowed = moderatorIds();
  if (!allowed.size || !allowed.has(user.$id)) {
    return { response: NextResponse.json({ error: "Moderator access is required." }, { status: 403 }) };
  }
  return { user };
}


async function recordAudit(event: { moderator_user_id: string; event_type: string; target_user_id?: string; report_id?: string; action?: string; outcome?: string; note?: string; created_at: string }) {
  const tableId = process.env.APPWRITE_MODERATION_AUDIT_TABLE_ID;
  if (!tableId) { console.error("Moderation audit table is not configured."); return; }
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    await tablesDB.createRow({ databaseId, tableId, rowId: "unique()", data: {
      moderator_user_id: event.moderator_user_id,
      event_type: event.event_type,
      target_user_id: event.target_user_id || "",
      report_id: event.report_id || "",
      action: event.action || "none",
      outcome: event.outcome || "",
      note: event.note || "",
      created_at: event.created_at,
    }});
  } catch (error) { console.error("Moderation audit write failed", error instanceof Error ? error.message : "unknown"); }
}

async function notifyMember(recipientUserId: string | undefined, type: string, message: string, referenceId: string, createdAt: string) {
  const tableId = process.env.APPWRITE_NOTIFICATIONS_TABLE_ID;
  if (!recipientUserId || !tableId) { console.error("Moderation notification recipient/table unavailable."); return; }
  try {
    const { tablesDB, databaseId } = communitySafetyStore();
    await tablesDB.createRow({ databaseId, tableId, rowId: "unique()", data: {
      recipient_user_id: recipientUserId, type, message, reference_id: referenceId, is_read: false, created_at: createdAt,
    }});
  } catch (error) { console.error("Moderation notification write failed", error instanceof Error ? error.message : "unknown"); }
}

function reportConfig() {
  const reports = process.env.APPWRITE_COMMUNITY_REPORTS_TABLE_ID;
  if (!reports) throw new Error("Community reports table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, reports };
}

export async function GET(request: Request) {
  const auth = await requireModerator();
  if ("response" in auth) return auth.response;
  try {
    const { tablesDB, databaseId, reports } = reportConfig();
    const status = cleanText(new URL(request.url).searchParams.get("status"), 30);
    const allowedStatuses = ["open", "reviewing", "resolved", "dismissed"];
    const queries = [
      ...(allowedStatuses.includes(status) ? [Query.equal("status", status)] : []),
      Query.orderDesc("created_at"),
      Query.limit(100),
    ];
    const result = await tablesDB.listRows({ databaseId, tableId: reports, queries });
    return NextResponse.json({ reports: result.rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Moderation queue lookup failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The moderation queue is not configured or is unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const auth = await requireModerator();
  if ("response" in auth) return auth.response;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid moderation decision." }, { status: 400 }); }

  const reportId = cleanText(body.reportId, 128);
  const status = cleanText(body.status, 30);
  const action = cleanText(body.action, 30) || "none";
  const resolutionNote = cleanText(body.resolutionNote, 1000);
  if (!reportId || !["reviewing", "resolved", "dismissed"].includes(status) ||
      !["none", "remove_content", "suspend_member"].includes(action) ||
      (status !== "resolved" && action !== "none") ||
      (status === "dismissed" && action !== "none") ||
      (status === "resolved" && !resolutionNote)) {
    return NextResponse.json({ error: "Provide a report, valid status, and a resolution note when resolving a report." }, { status: 400 });
  }

  try {
    const s = reportConfig();
    const report = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.reports, rowId: reportId });
    if (report.status === "resolved" || report.status === "dismissed") {
      return NextResponse.json({ error: "This report has already been closed." }, { status: 409 });
    }

    if (action === "remove_content") {
      if (report.target_type !== "post" || !report.content_reference) {
        return NextResponse.json({ error: "Content removal is currently supported only for reported community posts." }, { status: 400 });
      }
      const postTables = [process.env.APPWRITE_COMMUNITY_POSTS_TABLE_ID, process.env.APPWRITE_COMMUNITY_GROUP_POSTS_TABLE_ID].filter((value): value is string => Boolean(value));
      let removed = false;
      for (const tableId of postTables) {
        try {
          const post = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId, rowId: String(report.content_reference) });
          if (report.reported_user_id && post.author_user_id !== report.reported_user_id) {
            return NextResponse.json({ error: "The reported content owner does not match the report. No action was taken." }, { status: 409 });
          }
          await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId, rowId: String(post.$id), data: { status: "removed", updated_at: new Date().toISOString() } });
          removed = true;
          break;
        } catch (error) {
          if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
        }
      }
      if (!removed) return NextResponse.json({ error: "The reported post was not found. No moderation action was recorded." }, { status: 404 });
    }

    if (action === "suspend_member") {
      const targetUserId = typeof report.reported_user_id === "string" ? report.reported_user_id : "";
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const apiKey = process.env.APPWRITE_API_KEY;
      const accessDatabaseId = process.env.APPWRITE_ACCESS_DATABASE_ID;
      const accessCollectionId = process.env.APPWRITE_MEMBER_ACCESS_COLLECTION_ID;
      if (!targetUserId || !endpoint || !projectId || !apiKey || !accessDatabaseId || !accessCollectionId) {
        return NextResponse.json({ error: "Member access storage is not configured. No account restriction was applied." }, { status: 503 });
      }
      const databases = new Databases(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
      await databases.updateDocument(accessDatabaseId, accessCollectionId, targetUserId, { account_status: "suspended" });
    }

    const now = new Date().toISOString();
    const updated = await s.tablesDB.updateRow({
      databaseId: s.databaseId,
      tableId: s.reports,
      rowId: reportId,
      data: {
        status,
        reviewer_user_id: auth.user.$id,
        reviewed_at: now,
        resolution_note: resolutionNote,
        action_taken: action,
      },
    });
    await recordAudit({ moderator_user_id: auth.user.$id, event_type: "report_decision", target_user_id: typeof report.reported_user_id === "string" ? report.reported_user_id : undefined, report_id: reportId, action, outcome: status, note: resolutionNote, created_at: now });
    if (typeof report.reported_user_id === "string" && (action !== "none" || status === "resolved" || status === "dismissed")) {
      const message = action === "suspend_member" ? "A moderation decision has restricted your Connect account. You may submit an appeal." : action === "remove_content" ? "A moderation decision was made about content you posted. You may submit an appeal." : status === "dismissed" ? "A report concerning you was reviewed and dismissed." : "A report concerning you was reviewed. Check your account for details or appeal if applicable.";
      await notifyMember(report.reported_user_id, "moderation", message, reportId, now);
    }
    return NextResponse.json({ updated: true, report: updated }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Moderation decision failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The moderation decision could not be saved. Check the Appwrite moderation schema and permissions." }, { status: 503 });
  }
}
