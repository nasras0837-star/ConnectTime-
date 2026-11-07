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
    return NextResponse.json({ campaigns: result.rows }, { headers: { "Cache-Control": "no-store" } });
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
  const currency = "USD";
  const dailyBudget = Number(input.dailyBudget);
  const lifetimeCap = Number(input.lifetimeCap);
  const startAt = text("startAt", 40);
  const endAt = text("endAt", 40);
  const allowedObjectives = ["brand-awareness", "website-visits", "sales-leads", "event-attendance", "app-installs"];
  const allowedPlacements = ["feed", "banner", "video", "event"];
  const allowedStrategies = ["lowest-cost", "cost-cap", "bid-cap"];
  if (!company || !name || !allowedObjectives.includes(objective) || !allowedPlacements.includes(placement) ||
      !region || !country || !allowedStrategies.includes(bidStrategy) ||
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
    const row = await tablesDB.createRow({
      databaseId, tableId, rowId: ID.unique(),
      data: {
        advertiser_user_id: user.$id, company, campaign_name: name, objective, placement, region, country,
        daily_budget_minor: dailyBudget, lifetime_cap_minor: lifetimeCap, currency,
        bid_strategy: bidStrategy, status: "draft", moderation_status: "pending",
        human_review_status: "not_started", payment_status: "not_started",
        starts_at: new Date(startAt).toISOString(), ends_at: new Date(endAt).toISOString(),
        spend_minor: 0, created_at: new Date().toISOString(),
      },
    });
    return NextResponse.json({
      created: true, campaignId: row.$id, status: "draft",
      message: "Campaign saved as a draft. It is not approved, billed, or eligible for ad delivery.",
      paymentAllowed: false, deliveryAllowed: false,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Campaign creation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Campaign storage is not configured. No payment or ad delivery was started." }, { status: 503 });
  }
}
