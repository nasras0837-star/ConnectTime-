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
    const { databases, databaseId } = advertisingStore();
    const adsCollection = process.env.APPWRITE_ADS_COLLECTION_ID;
    const complaintsCollection = process.env.APPWRITE_AD_COMPLAINTS_COLLECTION_ID;
    if (!adsCollection || !complaintsCollection) throw new Error("Advertising collections are not configured.");
    const [ads, complaints] = await Promise.all([
      databases.listDocuments(databaseId, adsCollection, [Query.orderDesc("$createdAt"), Query.limit(100)]),
      databases.listDocuments(databaseId, complaintsCollection, [Query.orderDesc("$createdAt"), Query.limit(100)]),
    ]);
    return NextResponse.json({ ads: ads.documents, complaints: complaints.documents });
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
  const kind = body.kind === "complaint" ? "complaint" : body.kind === "ad" ? "ad" : "";
  const collection = kind === "complaint" ? process.env.APPWRITE_AD_COMPLAINTS_COLLECTION_ID : kind === "ad" ? process.env.APPWRITE_ADS_COLLECTION_ID : undefined;
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const allowed = kind === "complaint"
    ? ["under_review", "resolved", "dismissed", "takedown_requested"]
    : ["approved", "rejected", "paused", "takedown"];
  if (!collection || !id || !allowed.includes(action)) return NextResponse.json({ error: "Invalid item or review action." }, { status: 400 });
  try {
    const { databases, databaseId } = advertisingStore();
    const updated = await databases.updateDocument(databaseId, collection, id, {
      status: action, reviewedAt: new Date().toISOString(),
    });
    return NextResponse.json({ updated: true, id: updated.$id, status: action });
  } catch (error) {
    console.error("Advertising review update failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not update this review item." }, { status: 503 });
  }
}
