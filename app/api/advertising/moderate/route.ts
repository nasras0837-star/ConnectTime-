import { NextResponse } from "next/server";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { checkMemberAccess } from "@/lib/member-access";
import { advertisingStore, ID } from "@/lib/advertising-store";

export const runtime = "nodejs";

type ReviewBody = {
  company?: unknown;
  campaign?: unknown;
  headline?: unknown;
  body?: unknown;
  imageUrl?: unknown;
  rightsConfirmed?: unknown;
};

export async function POST(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) return NextResponse.json({ status: "unavailable", error: "Account verification is not configured. Ad submissions are blocked." }, { status: 503 });
  const user = await createNextServerHelpers({ endpoint, projectId }).getLoggedInUser();
  if (!user) return NextResponse.json({ status: "unauthenticated", error: "Sign in before submitting an advertisement." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ status: "not_verified", error: "Verified adult member access is required to submit an advertisement." }, { status: access.status });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: "unavailable", error: "AI ad screening is not configured. Ads cannot be submitted, paid for, or published." },
      { status: 503 },
    );
  }

  let input: ReviewBody;
  try {
    input = await request.json() as ReviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid ad review request." }, { status: 400 });
  }

  const company = typeof input.company === "string" ? input.company.trim().slice(0, 160) : "";
  const campaign = typeof input.campaign === "string" ? input.campaign.trim().slice(0, 160) : "";
  const headline = typeof input.headline === "string" ? input.headline.trim().slice(0, 200) : "";
  const body = typeof input.body === "string" ? input.body.trim().slice(0, 2000) : "";
  const imageUrl = typeof input.imageUrl === "string" ? input.imageUrl.trim() : "";
  if (!company || !campaign || (!headline && !body && !imageUrl)) {
    return NextResponse.json({ error: "Enter the advertiser, campaign, and at least one ad creative element." }, { status: 400 });
  }
  if (input.rightsConfirmed !== true) {
    return NextResponse.json({ error: "Confirm that you own or have permission to use all submitted creative and brand assets." }, { status: 400 });
  }

  const content: Array<Record<string, unknown>> = [{
    type: "text",
    text: [
      "Screen this advertisement for compliance with a strict general-audience social platform advertising policy.",
      "Reject or flag nudity, sexually explicit or suggestive content, sexual services, exploitation, any sexualization of minors, hate, harassment, graphic violence, self-harm, illegal goods/services, scams, deceptive claims, and other unsafe or prohibited advertising.",
      "Advertiser: " + company,
      "Campaign: " + campaign,
      "Headline: " + headline,
      "Ad text: " + body,
    ].join("\n"),
  }];
  if (imageUrl) {
    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "The creative image URL is invalid." }, { status: 400 });
    }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return NextResponse.json({ error: "Creative image URLs must use HTTPS and cannot contain credentials." }, { status: 400 });
    }
    content.push({ type: "image_url", image_url: { url: imageUrl } });
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({ model: "omni-moderation-latest", input: [{ role: "user", content }] }),
    });
    const result = await upstream.json();
    if (!upstream.ok) {
      console.error("ConnectTime ad moderation provider error", upstream.status);
      return NextResponse.json({ status: "unavailable", error: "AI screening could not be completed. No payment or publication is allowed." }, { status: 502 });
    }
    const moderation = result.results?.[0];
    if (!moderation || typeof moderation.flagged !== "boolean") {
      return NextResponse.json({ status: "unavailable", error: "AI screening returned an unusable result. No payment or publication is allowed." }, { status: 502 });
    }

    const flaggedCategories = Object.entries(moderation.categories || {})
      .filter(([, flagged]) => flagged === true)
      .map(([name]) => name);
    const status = moderation.flagged ? "rejected" : "manual_review_required";

    let adSubmissionId = "";
    try {
      const { tablesDB, databaseId } = advertisingStore();
      const tableId = process.env.APPWRITE_ADS_TABLE_ID;
      if (!tableId) throw new Error("Ad submissions table is not configured.");
      const storedAd = await tablesDB.createRow({
        databaseId,
        tableId,
        rowId: ID.unique(),
        data: {
          advertiser_user_id: user.$id, ad_company: company, campaign_name: campaign, ad_headline: headline, ad_body: body, image_url: imageUrl, rights_confirmed: true,
          status, flagged_categories: flaggedCategories.join(","), created_at: new Date().toISOString(),
        },
      });
      adSubmissionId = storedAd.$id;
    } catch (error) {
      console.error("Advertising submission could not be stored", error instanceof Error ? error.message : "unknown");
      return NextResponse.json({ status: "unavailable", paymentAllowed: false, publicationAllowed: false, error: "The review queue is not configured. The ad was not accepted, charged, or published." }, { status: 503 });
    }

    if (moderation.flagged) {
      return NextResponse.json({
        status: "rejected",
        adSubmissionId,
        paymentAllowed: false,
        publicationAllowed: false,
        message: "The AI safety screen flagged this ad. It cannot proceed to payment or publication.",
        flaggedCategories,
      }, { status: 200 });
    }

    return NextResponse.json({
      status: "manual_review_required",
      adSubmissionId,
      paymentAllowed: false,
      publicationAllowed: false,
      message: "The AI safety screen did not flag the submitted text/image. This is not final approval. Copyright, trademark, advertiser identity, claims, and policy compliance still require human review before payment or publication.",
      flaggedCategories: [],
    });
  } catch (error) {
    console.error("ConnectTime ad moderation request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ status: "unavailable", error: "AI screening is temporarily unavailable. No payment or publication is allowed." }, { status: 502 });
  }
}
