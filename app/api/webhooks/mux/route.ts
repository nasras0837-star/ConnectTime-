import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { communitySafetyStore } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;
const SIGNATURE_TOLERANCE_SECONDS = 300;

function validMuxSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !/^\d{10}$/.test(timestamp) || signatures.length === 0) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (age > SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + rawBody).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

type MuxEvent = {
  id?: string;
  type?: string;
  object?: { type?: string; id?: string };
  data?: {
    id?: string;
    upload_id?: string;
    asset_id?: string;
    status?: string;
    playback_ids?: Array<{ id?: string; policy?: string }>;
  };
};

export async function POST(request: Request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook verification is not configured." }, { status: 503 });

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  if (!validMuxSignature(rawBody, request.headers.get("mux-signature"), secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: MuxEvent;
  try {
    event = JSON.parse(rawBody) as MuxEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
  if (!event.id || !event.type || !event.object?.id || !event.data) {
    return NextResponse.json({ error: "Incomplete webhook event." }, { status: 400 });
  }

  const tableId = process.env.APPWRITE_VIDEO_TUBE_TABLE_ID?.trim();
  if (!tableId) return NextResponse.json({ error: "Video Tube storage is not configured." }, { status: 503 });

  try {
    const store = communitySafetyStore();
    const isUploadEvent = event.type.startsWith("video.upload.");
    const lookupField = isUploadEvent ? "mux_upload_id" : "mux_asset_id";
    const lookupId = event.object.id;
    const matches = await store.tablesDB.listRows({
      databaseId: store.databaseId,
      tableId,
      queries: [Query.equal("record_type", "clip"), Query.equal(lookupField, lookupId), Query.limit(2)],
    });
    if (matches.rows.length === 0) {
      // Acknowledge unrelated/late events so Mux does not retry indefinitely.
      return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }
    if (matches.rows.length !== 1) {
      console.error("Mux webhook matched multiple Connect video rows", event.id);
      return NextResponse.json({ error: "Webhook correlation is ambiguous." }, { status: 409 });
    }

    const row = matches.rows[0];
    if (String(row.mux_last_event_id || "") === event.id) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    const data: Record<string, unknown> = {
      mux_last_event_id: event.id,
      updated_at: new Date().toISOString(),
    };
    switch (event.type) {
      case "video.upload.asset_created":
        if (typeof event.data.asset_id === "string") data.mux_asset_id = event.data.asset_id;
        data.mux_processing_status = "processing";
        data.status = "pending_review";
        break;
      case "video.asset.ready": {
        const signedPlayback = event.data.playback_ids?.find((item) => item.policy === "signed")?.id;
        if (typeof signedPlayback === "string") data.mux_playback_id = signedPlayback;
        data.mux_processing_status = "ready_pending_moderation";
        data.status = "pending_review";
        // Never set media_url or status=approved from a Mux processing event.
        break;
      }
      case "video.asset.errored":
      case "video.upload.errored":
      case "video.upload.cancelled":
        data.mux_processing_status = "errored";
        data.status = "rejected";
        break;
      default:
        return NextResponse.json({ received: true, ignored: true }, { status: 200 });
    }

    await store.tablesDB.updateRow({
      databaseId: store.databaseId,
      tableId,
      rowId: String(row.$id),
      data,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Mux webhook processing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Webhook processing is temporarily unavailable." }, { status: 503 });
  }
}
