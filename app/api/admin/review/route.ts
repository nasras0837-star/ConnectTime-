import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { cleanText, communitySafetyStore, sameOrigin } from "@/lib/community-safety";
import { currentConnectAdmin, isAdminAllowlistConfigured } from "@/lib/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json({ error: "Admin review storage is not fully configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (!isAdminAllowlistConfigured()) return unavailable();
  const admin = await currentConnectAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access is required." }, { status: 403, headers: { "Cache-Control": "no-store" } });

  try {
    const reportsTableId = process.env.APPWRITE_COMMUNITY_REPORTS_TABLE_ID;
    const closuresTableId = process.env.APPWRITE_ACCOUNT_CLOSURE_REQUESTS_TABLE_ID;
    if (!reportsTableId || !closuresTableId) return unavailable();
    const { tablesDB, databaseId } = communitySafetyStore();
    const [reportRows, closureRows] = await Promise.all([
      tablesDB.listRows({ databaseId, tableId: reportsTableId, queries: [Query.orderDesc("$createdAt"), Query.limit(100)] }),
      tablesDB.listRows({ databaseId, tableId: closuresTableId, queries: [Query.orderDesc("$createdAt"), Query.limit(100)] })
    ]);
    const reports = reportRows.rows.map(row => ({
      id: String(row.$id),
      reporterUserId: String(row.reporter_user_id || ""),
      reportedUserId: String(row.reported_user_id || ""),
      targetType: String(row.target_type || ""),
      contentReference: String(row.content_reference || ""),
      category: String(row.category || ""),
      details: String(row.details || ""),
      status: String(row.status || "open"),
      createdAt: String(row.created_at || row.$createdAt || "")
    }));
    const closures = closureRows.rows.map(row => ({
      id: String(row.$id),
      userId: String(row.user_id || ""),
      reason: String(row.reason || ""),
      status: String(row.status || "pending_review"),
      requestedAt: String(row.requested_at || row.$createdAt || "")
    }));
    return NextResponse.json({ reports, closures }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
  } catch (error) {
    console.error("Admin review queue failed", error instanceof Error ? error.message : "unknown");
    return unavailable();
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  if (!isAdminAllowlistConfigured()) return unavailable();
  const admin = await currentConnectAdmin();
  if (!admin) return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid review update." }, { status: 400 }); }

  const queue = cleanText(body.queue, 20);
  const id = cleanText(body.id, 128);
  const status = cleanText(body.status, 30);
  const reportStatuses = ["open", "reviewing", "actioned", "dismissed"];
  const closureStatuses = ["pending_review", "approved", "rejected", "processed"];
  if (!id || (queue !== "report" && queue !== "closure")) {
    return NextResponse.json({ error: "Choose a valid review item." }, { status: 400 });
  }
  if (queue === "report" ? !reportStatuses.includes(status) : !closureStatuses.includes(status)) {
    return NextResponse.json({ error: "That status is not allowed for this review queue." }, { status: 400 });
  }

  try {
    const tableId = queue === "report" ? process.env.APPWRITE_COMMUNITY_REPORTS_TABLE_ID : process.env.APPWRITE_ACCOUNT_CLOSURE_REQUESTS_TABLE_ID;
    if (!tableId) return unavailable();
    const { tablesDB, databaseId } = communitySafetyStore();
    await tablesDB.updateRow({ databaseId, tableId, rowId: id, data: { status } });
    return NextResponse.json({ updated: true, queue, id, status, reviewedBy: admin.$id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Admin review update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The review item could not be updated. Check the table configuration and try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
