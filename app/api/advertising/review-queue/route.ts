import { NextResponse } from "next/server";
import { advertisingStore, Query, requireReviewAdmin } from "@/lib/advertising-store";

export const runtime = "nodejs";

function authorized(request: Request) {
  if (!process.env.AD_REVIEW_ADMIN_TOKEN) return NextResponse.json({ error: "Review dashboard is not configured." }, { status: 503 });
  if (!requireReviewAdmin(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  try {
    const { tablesDB, databaseId } = advertisingStore();
    const adsTable = process.env.APPWRITE_ADS_TABLE_ID;
    const complaintsTable = process.env.APPWRITE_AD_COMPLAINTS_TABLE_ID;
    const campaignsTable = process.env.APPWRITE_AD_CAMPAIGNS_TABLE_ID;
    if (!adsTable || !complaintsTable || !campaignsTable) throw new Error("Advertising tables are not configured.");
    const eventsTable = process.env.APPWRITE_EVENTS_TABLE_ID;
    const [ads, complaints, campaigns, events] = await Promise.all([
      tablesDB.listRows({ databaseId, tableId: adsTable, queries: [Query.orderDesc("$createdAt"), Query.limit(100)] }),
      tablesDB.listRows({ databaseId, tableId: complaintsTable, queries: [Query.orderDesc("$createdAt"), Query.limit(100)] }),
      tablesDB.listRows({ databaseId, tableId: campaignsTable, queries: [Query.orderDesc("$createdAt"), Query.limit(100)] }),
      eventsTable ? tablesDB.listRows({ databaseId, tableId: eventsTable, queries: [Query.equal("status", "pending_review"), Query.orderDesc("$createdAt"), Query.limit(100)] }) : Promise.resolve({ rows: [] }),
    ]);
    return NextResponse.json({ ads: ads.rows, complaints: complaints.rows, campaigns: campaigns.rows, events: events.rows });
  } catch (error) {
    console.error("Advertising review queue failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Review storage is unavailable or not configured." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const denied = authorized(request);
  if (denied) return denied;
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid review action." }, { status: 400 }); }
  const kind = body.kind === "complaint" ? "complaint" : body.kind === "campaign" ? "campaign" : body.kind === "ad" ? "ad" : body.kind === "event" ? "event" : "";
  const tableId = kind === "complaint" ? process.env.APPWRITE_AD_COMPLAINTS_TABLE_ID : kind === "campaign" ? process.env.APPWRITE_AD_CAMPAIGNS_TABLE_ID : kind === "ad" ? process.env.APPWRITE_ADS_TABLE_ID : kind === "event" ? process.env.APPWRITE_EVENTS_TABLE_ID : undefined;
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const allowed = kind === "complaint"
    ? ["under_review", "resolved", "dismissed", "takedown_requested"]
    : kind === "campaign" ? ["approved", "rejected", "paused"] : kind === "event" ? ["published", "rejected"] : ["approved", "rejected", "paused", "takedown"];
  if (!tableId || !id || !allowed.includes(action)) return NextResponse.json({ error: "Invalid item or review action." }, { status: 400 });
  try {
    const { tablesDB, databaseId } = advertisingStore();
    const updated = await tablesDB.updateRow({
      databaseId,
      tableId,
      rowId: id,
      data: kind === "campaign" ? { status: action, human_review_status: action, reviewed_at: new Date().toISOString() } : kind === "event" ? { status: action, updated_at: new Date().toISOString() } : { status: action, reviewedAt: new Date().toISOString() },
    });
    return NextResponse.json({ updated: true, id: updated.$id, status: action });
  } catch (error) {
    console.error("Advertising review update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not update this review item." }, { status: 503 });
  }
}
