import { NextResponse } from "next/server";
import { advertisingStore, ID } from "@/lib/advertising-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid complaint." }, { status: 400 }); }

  const type = typeof body.type === "string" ? body.type : "";
  const adReference = typeof body.adReference === "string" ? body.adReference.trim().slice(0, 160) : "";
  const workDescription = typeof body.workDescription === "string" ? body.workDescription.trim().slice(0, 2000) : "";
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 4000) : "";
  const claimantName = typeof body.claimantName === "string" ? body.claimantName.trim().slice(0, 160) : "";
  const claimantEmail = typeof body.claimantEmail === "string" ? body.claimantEmail.trim().slice(0, 254) : "";
  const claimantAddress = typeof body.claimantAddress === "string" ? body.claimantAddress.trim().slice(0, 1000) : "";
  const electronicSignature = typeof body.electronicSignature === "string" ? body.electronicSignature.trim().slice(0, 160) : "";
  const goodFaith = body.goodFaith === true;
  if (!["copyright", "trademark", "nudity", "sexual", "misleading", "other"].includes(type) ||
      !adReference || !details || !claimantName || !/^\S+@\S+\.\S+$/.test(claimantEmail) || !goodFaith) {
    return NextResponse.json({ error: "Complete all required fields and confirm the good-faith statement." }, { status: 400 });
  }

  try {
    const { databases, databaseId } = advertisingStore();
    const collectionId = process.env.APPWRITE_AD_COMPLAINTS_COLLECTION_ID;
    if (!collectionId) throw new Error("Complaint collection is not configured.");
    const doc = await databases.createDocument(databaseId, collectionId, ID.unique(), {
      type, adReference, workDescription, details, claimantName, claimantEmail,
      status: "received", goodFaith, createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ received: true, reference: doc.$id, message: "Your report has been received for review. A report does not itself determine infringement." }, { status: 201 });
  } catch (error) {
    console.error("Advertising complaint storage failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The reporting service is not configured or is temporarily unavailable. Please contact ConnectTime support." }, { status: 503 });
  }
}
