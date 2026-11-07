import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { currentCommunityMember, communitySafetyStore, sameOrigin, cleanText } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = ["overall", "design", "features", "performance", "safety", "accessibility", "other"];

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Please sign in before submitting feedback." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: "Invalid feedback submission." }, { status: 400 }); }

  const rating = Number(body.rating);
  const category = cleanText(body.category, 30);
  const feedback = cleanText(body.feedback, 2000);
  const idea = cleanText(body.idea, 2000);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  if (!categories.includes(category) || feedback.length < 5) return NextResponse.json({ error: "Choose a feedback topic and provide at least 5 characters about your experience." }, { status: 400 });
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(feedback + idea)) return NextResponse.json({ error: "Feedback contains unsupported control characters." }, { status: 400 });

  try {
    const tableId = process.env.APPWRITE_USER_FEEDBACK_TABLE_ID;
    if (!tableId) throw new Error("Feedback table is not configured.");
    const { tablesDB, databaseId } = communitySafetyStore();
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const recent = await tablesDB.listRows({ databaseId, tableId, queries: [Query.equal("user_id", user.$id), Query.greaterThanEqual("created_at", since), Query.limit(4)] });
    if (recent.rows.length >= 3) return NextResponse.json({ error: "You have reached the feedback submission limit. Please try again later." }, { status: 429 });
    const row = await tablesDB.createRow({
      databaseId,
      tableId,
      rowId: ID.unique(),
      data: { user_id: user.$id, rating, category, feedback, idea, status: "new", created_at: new Date().toISOString() },
    });
    return NextResponse.json({ submitted: true, reference: row.$id, message: "Thank you. Your feedback has been received." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ConnectTime feedback submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "The feedback service is not configured or is temporarily unavailable. Your response was not submitted." }, { status: 503 });
  }
}
