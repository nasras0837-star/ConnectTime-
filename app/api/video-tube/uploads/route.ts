import { NextResponse } from "next/server";
import { checkMemberAccess } from "@/lib/member-access";
import { currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 120;
const MAX_CAPTION_LENGTH = 1_000;
const ALLOWED_CATEGORIES = new Set([
  "Education", "Entertainment", "Gaming", "Lifestyle", "Music", "News",
  "Sports", "Technology", "Travel", "Other",
]);

/** Creates a private Mux Direct Upload URL; release-gated and fail-closed. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  if (
    process.env.VIDEO_UPLOADS_ENABLED !== "true" ||
    process.env.VIDEO_MODERATION_PIPELINE_READY !== "true"
  ) {
    return NextResponse.json(
      { error: "Video uploads are temporarily disabled while safety checks are being completed." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const member = await currentCommunityMember();
  if (!member) return NextResponse.json({ error: "Sign in to upload a video." }, { status: 401 });

  const access = await checkMemberAccess();
  if (!access.allowed) {
    return NextResponse.json(
      { error: "Verified adult membership with an active account is required to upload." },
      { status: access.status },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid video upload request." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  const category = typeof body.category === "string" ? body.category : "Other";
  if (!title || title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "Add a video title of 1–120 characters." }, { status: 400 });
  }
  if (caption.length > MAX_CAPTION_LENGTH || !ALLOWED_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "The caption or category is invalid." }, { status: 400 });
  }
  if (body.rightsAttested !== true) {
    return NextResponse.json({ error: "Confirm that you own or are licensed to upload this content." }, { status: 400 });
  }

  const muxTokenId = process.env.MUX_TOKEN_ID;
  const muxTokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!muxTokenId || !muxTokenSecret) {
    return NextResponse.json({ error: "Video uploads are not configured by Connect yet." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "A verified browser origin is required." }, { status: 403 });

  const authorization = Buffer.from(muxTokenId + ":" + muxTokenSecret).toString("base64");
  let muxResponse: Response;
  try {
    muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        Authorization: "Basic " + authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: origin,
        new_asset_settings: {
          playback_policies: ["signed"],
          video_quality: "basic",
          passthrough: JSON.stringify({
            memberId: member.$id,
            title,
            caption,
            category,
            reviewStatus: "pending_review",
          }),
        },
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "The video service could not be reached. Try again later." }, { status: 502 });
  }

  const muxData = await muxResponse.json().catch(() => null) as {
    data?: { id?: string; url?: string };
  } | null;

  if (!muxResponse.ok || !muxData?.data?.id || !muxData.data.url) {
    return NextResponse.json(
      { error: "The video service could not create an upload session." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      uploadId: muxData.data.id,
      uploadUrl: muxData.data.url,
      status: "pending_review",
      message: "Upload received for moderation. It will not be published automatically.",
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
