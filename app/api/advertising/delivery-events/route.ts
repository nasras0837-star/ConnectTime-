import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { advertisingStore, ID } from "@/lib/advertising-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validSignature(raw: string, timestamp: string, signature: string, secret: string) {
  const seconds = Number(timestamp);
  if (!Number.isInteger(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + raw).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature.replace(/^sha256=/i, ""), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.AD_DELIVERY_EVENT_SECRET;
  const tableId = process.env.APPWRITE_AD_DELIVERY_EVENTS_TABLE_ID;
  if (!secret || !tableId) return NextResponse.json({ error: "Verified ad measurement is not configured." }, { status: 503 });

  const timestamp = request.headers.get("x-ct-ad-event-timestamp") || "";
  const signature = request.headers.get("x-ct-ad-event-signature") || "";
  const raw = await request.text();
  if (!validSignature(raw, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid or expired delivery-event signature." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = JSON.parse(raw) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid event payload." }, { status: 400 }); }

  const campaignId = typeof body.campaignId === "string" ? body.campaignId.trim().slice(0, 128) : "";
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  const eventType = body.eventType === "impression" || body.eventType === "click" ? body.eventType : "";
  const placement = typeof body.placement === "string" ? body.placement.trim().slice(0, 40) : "";
  const measurementVersion = typeof body.measurementVersion === "string" ? body.measurementVersion.trim().slice(0, 32) : "v1";
  if (!campaignId || !/^[a-zA-Z0-9_-]{16,64}$/.test(eventId) || !eventType || !placement) {
    return NextResponse.json({ error: "Campaign, unique event ID, event type, and placement are required." }, { status: 400 });
  }

  try {
    const { tablesDB, databaseId } = advertisingStore();
    const campaignsTable = process.env.APPWRITE_AD_CAMPAIGNS_TABLE_ID;
    if (!campaignsTable) return NextResponse.json({ error: "Campaign storage is not configured." }, { status: 503 });
    const campaign = await tablesDB.getRow({ databaseId, tableId: campaignsTable, rowId: campaignId });
    const now = Date.now();
    const starts = Date.parse(String(campaign.starts_at || ""));
    const ends = Date.parse(String(campaign.ends_at || ""));
    if (campaign.status !== "approved" || campaign.human_review_status !== "approved" ||
        !["authorized", "paid"].includes(String(campaign.payment_status)) ||
        !Number.isFinite(starts) || !Number.isFinite(ends) || now < starts || now > ends) {
      return NextResponse.json({ error: "Campaign is not eligible for ad delivery measurement." }, { status: 409 });
    }
    try {
      await tablesDB.createRow({
        databaseId, tableId, rowId: eventId || ID.unique(),
        data: {
          campaign_id: campaignId,
          advertiser_user_id: String(campaign.advertiser_user_id),
          event_type: eventType,
          placement,
          occurred_at: new Date().toISOString(),
          validity_status: "valid",
          deduplication_key: eventId,
          measurement_version: measurementVersion,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("already exists") || message.includes("duplicate") || message.includes("conflict")) {
        return NextResponse.json({ accepted: true, duplicate: true }, { status: 200 });
      }
      throw error;
    }
    return NextResponse.json({ accepted: true, duplicate: false }, { status: 201 },);
  } catch (error) {
    console.error("Ad delivery event could not be recorded", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Delivery event could not be recorded." }, { status: 503 });
  }
}
