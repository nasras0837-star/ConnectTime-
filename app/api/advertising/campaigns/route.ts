import { NextResponse } from "next/server";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { advertisingStore, ID, Query } from "@/lib/advertising-store";
import { checkMemberAccess } from "@/lib/member-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentAdvertiser() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return null;
  try {
    const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
    return user ?? null;
  } catch { return null; }
}

export async function GET() {
  const user = await currentAdvertiser();
  if (!user) return NextResponse.json({ error: "Sign in to view your campaigns." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified member access is required to manage advertising campaigns." }, { status: access.status });
  try {
    const tableId = process.env.APPWRITE_AD_CAMPAIGNS_TABLE_ID;
    if (!tableId) throw new Error("Campaign table is not configured.");
    const { tablesDB, databaseId } = advertisingStore();
    const result = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("advertiser_user_id", user.$id), Query.orderDesc("$createdAt"), Query.limit(100)] });
    const eventsTable = process.env.APPWRITE_AD_DELIVERY_EVENTS_TABLE_ID;
    const campaigns = await Promise.all(result.rows.map(async (campaign) => {
      if (!eventsTable) return { ...campaign, impressions_count: 0, clicks_count: 0, metrics_status: "not_configured" };
      try {
        const [impressions, clicks] = await Promise.all([
          tablesDB.listRows({ databaseId, tableId: eventsTable, queries: [Query.equal("campaign_id", campaign.$id), Query.equal("event_type", "impression"), Query.equal("validity_status", "valid"), Query.limit(1)] }),
          tablesDB.listRows({ databaseId, tableId: eventsTable, queries: [Query.equal("campaign_id", campaign.$id), Query.equal("event_type", "click"), Query.equal("validity_status", "valid"), Query.limit(1)] }),
        ]);
        return { ...campaign, impressions_count: impressions.total, clicks_count: clicks.total, metrics_status: "verified_events" };
      } catch {
        return { ...campaign, impressions_count: 0, clicks_count: 0, metrics_status: "temporarily_unavailable" };
      }
    }));
    return NextResponse.json({ campaigns }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Campaign listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Campaign storage is not configured or is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await currentAdvertiser();
  if (!user) return NextResponse.json({ error: "Sign in to create an advertising campaign." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified member access is required before creating a campaign." }, { status: access.status });
  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid campaign request." }, { status: 400 }); }

  const text = (key: string, max: number) => typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "";
  const company = text("company", 160);
  const name = text("campaignName", 160);
  const objective = text("objective", 40);
  const placement = text("placement", 40);
  const region = text("region", 80);
  const country = text("country", 100);
  const bidStrategy = text("bidStrategy", 24);
  const adSubmissionId = text("adSubmissionId", 64);
  const refundPolicyAccepted = input.refundPolicyAccepted === true;
  const geoTargets = text("geoTargets", 2000);
  const currency = "USD";
  const dailyBudget = Number(input.dailyBudgetMinor);
  const lifetimeCap = Number(input.lifetimeCapMinor);
  const startAt = text("startAt", 40);
  const endAt = text("endAt", 40);
  const allowedObjectives = ["brand-awareness", "website-visits", "sales-leads", "event-attendance", "app-installs"];
  const allowedPlacements = ["feed", "banner", "video", "event"];
  const allowedStrategies = ["lowest-cost", "cost-cap", "bid-cap"];
  if (!company || !name || !allowedObjectives.includes(objective) || !allowedPlacements.includes(placement) ||
      !region || !country || !adSubmissionId || !refundPolicyAccepted || !allowedStrategies.includes(bidStrategy) ||
      !Number.isSafeInteger(dailyBudget) || !Number.isSafeInteger(lifetimeCap) ||
      dailyBudget < 100 || lifetimeCap < dailyBudget || lifetimeCap > 100000000 ||
      !startAt || !endAt || !Number.isFinite(Date.parse(startAt)) || !Number.isFinite(Date.parse(endAt)) ||
      Date.parse(endAt) < Date.parse(startAt)) {
    return NextResponse.json({ error: "Check campaign details. Daily budget must be at least $1.00, the total cap must be at least the daily budget, and dates must be valid." }, { status: 400 });
  }
  try {
    const tableId = process.env.APPWRITE_AD_CAMPAIGNS_TABLE_ID;
    if (!tableId) throw new Error("Campaign table is not configured.");
    const { tablesDB, databaseId } = advertisingStore();
    const adsTableId = process.env.APPWRITE_ADS_TABLE_ID;
    if (!adsTableId) throw new Error("Ad submissions table is not configured.");
    const adSubmission = await tablesDB.getRow({ databaseId, tableId: adsTableId, rowId: adSubmissionId });
    if (adSubmission.advertiser_user_id !== user.$id) {
      return NextResponse.json({ error: "This ad submission does not belong to your advertiser account." }, { status: 403 });
    }
    const row = await tablesDB.createRow({
      databaseId, tableId, rowId: ID.unique(),
      data: {
        advertiser_user_id: user.$id, ad_submission_id: adSubmissionId, company, campaign_name: name, objective, placement, region, country, geo_targets: geoTargets,
        daily_budget_minor: dailyBudget, lifetime_cap_minor: lifetimeCap, currency,
        bid_strategy: bidStrategy, status: "pending_review", moderation_status: "passed_initial_screen",
        human_review_status: "pending", payment_status: "not_started",
        starts_at: new Date(startAt).toISOString(), ends_at: new Date(endAt).toISOString(),
        spend_minor: 0, impressions_count: 0, clicks_count: 0, refund_policy_accepted: true, refund_policy_accepted_at: new Date().toISOString(), created_at: new Date().toISOString(),
      },
    });
    return NextResponse.json({
      created: true, campaignId: row.$id, status: "pending_review",
      message: "Campaign saved for human review with refund-policy acknowledgment recorded. It is not approved, billed, or eligible for ad delivery.",
      paymentAllowed: false, deliveryAllowed: false,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Campaign creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Campaign storage is not configured. No payment or ad delivery was started." }, { status: 503 });
  }
}
