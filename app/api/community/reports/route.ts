import { NextResponse } from "next/server";
import { communitySafetyStore, cleanText, currentCommunityMember, sameOrigin } from "@/lib/community-safety";
import { ID, Query } from "node-appwrite";
import { validateReportInput } from "@/lib/report-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before submitting a safety report." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid report." }, { status: 400 }); }

  const category = cleanText(body.category, 40);
  const targetType = cleanText(body.targetType, 20);
  const targetUserId = cleanText(body.targetUserId, 128);
  const contentReference = cleanText(body.contentReference, 180);
  const details = cleanText(body.details, 3000);
  if (!validateReportInput({ category, targetType, targetUserId, contentReference, details, reporterUserId: user.$id })) {
    return NextResponse.json({ error: "Choose a report reason, identify the content or member, and provide at least 10 characters of detail." }, { status: 400 });
  }
  try {
    const tableId = process.env.APPWRITE_COMMUNITY_REPORTS_TABLE_ID;
    if (!tableId) throw new Error("Community reports table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const recent = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("reporter_user_id", user.$id), Query.orderDesc("$createdAt"), Query.limit(20)] });
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const reportsToday = recent.rows.filter(item => {
      const created = Date.parse(String(item.created_at || ""));
      return Number.isFinite(created) && created >= dayStart.getTime();
    }).length;
    if (reportsToday >= 5) return NextResponse.json({ error: "You have reached the daily report limit. If someone is in immediate danger, contact local emergency services." }, { status: 429, headers: { "Cache-Control": "no-store" } });
    const row = await tablesDB.createRow({ databaseId, tableId, rowId: ID.unique(), data: {
      reporter_user_id: user.$id, ...(targetUserId ? { reported_user_id: targetUserId } : {}), target_type: targetType,
      ...(contentReference ? { content_reference: contentReference } : {}), category, details, status: "open", created_at: new Date().toISOString(),
    } });
    return NextResponse.json({ submitted: true, reference: row.$id, message: "Your report was submitted for review. If you are in immediate danger, contact local emergency services." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Community report submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The reporting service is not configured or is temporarily unavailable. Your report was not submitted." }, { status: 503 });
  }
}
