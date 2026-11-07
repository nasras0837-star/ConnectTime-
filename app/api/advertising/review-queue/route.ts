import { NextResponse } from "next/server";
import { advertisingStore, Query } from "@/lib/advertising-store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!process.env.AD_REVIEW_ADMIN_TOKEN) return NextResponse.json({ error: "Review dashboard is not configured." }, { status: 503 });
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (auth !== process.env.AD_REVIEW_ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
  if (!process.env.AD_REVIEW_ADMIN_TOKEN) return NextResponse.json({ error: "Review dashboard is not configured." }, { status: 503 });
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (auth !== process.env.AD_REVIEW_ADMIN_TOKEN) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid review action." }, { status: 400 }); }
  const collection = body.kind === "complaint" ? process.env.APPWRITE_AD_COMPLAINTS_COLLECTION_ID : process.env.APPWRITE_ADS_COLLECTION_ID;
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const allowed = body.kind === "complaint"
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
