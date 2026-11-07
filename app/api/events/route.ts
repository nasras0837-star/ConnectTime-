import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { checkMemberAccess } from "@/lib/member-access";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = ["Community & social", "Music & nightlife", "Sports & outdoors", "Markets & food", "Arts & culture", "Business & learning", "Family-friendly"];
const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

function setup() {
  const tableId = process.env.APPWRITE_EVENTS_TABLE_ID;
  if (!tableId) throw new Error("Events table is not configured.");
  const { tablesDB, databaseId } = communitySafetyStore();
  return { tablesDB, databaseId, tableId };
}

export async function GET(request: Request) {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to explore community events." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  try {
    const s = setup();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const city = text(searchParams.get("city"), 70);
    const queries = [Query.equal("status", "published"), Query.greaterThanEqual("date", new Date().toISOString().slice(0, 10)), Query.orderAsc("date"), Query.limit(100)];
    if (categories.includes(category)) queries.push(Query.equal("category", category));
    if (city) queries.push(Query.search("city", city));
    const result = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.tableId, queries });
    return NextResponse.json({ events: result.rows.map(row => ({
      id: String(row.$id), title: String(row.title || ""), category: String(row.category || ""),
      date: String(row.date || ""), time: String(row.time || ""), city: String(row.city || ""),
      country: String(row.country || ""), venue: String(row.venue || ""), description: String(row.description || ""),
      price: String(row.price || "Free"), host: String(row.host || ""), emoji: String(row.emoji || "📅"),
    })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Event listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Events are not configured or temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before publishing an event." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership is required." }, { status: access.status });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid event." }, { status: 400 }); }
  const event = {
    title: text(body.title, 90), category: text(body.category, 50), date: text(body.date, 10),
    time: text(body.time, 5), city: text(body.city, 70), country: text(body.country, 70),
    venue: text(body.venue, 120), description: text(body.description, 600),
    price: text(body.price, 30) || "Free", host: text(body.host, 70),
  };
  if (!event.title || !categories.includes(event.category) || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) || event.date < new Date().toISOString().slice(0, 10) || !/^\d{2}:\d{2}$/.test(event.time) || !event.city || !event.country || !event.venue || !event.description || !event.host) {
    return NextResponse.json({ error: "Complete all required fields with a valid future date, time, and category." }, { status: 400 });
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(Object.values(event).join(""))) return NextResponse.json({ error: "Event details contain unsupported control characters." }, { status: 400 });
  try {
    const s = setup();
    const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const recent = await s.tablesDB.listRows({ databaseId: s.databaseId, tableId: s.tableId, queries: [Query.equal("host_user_id", user.$id), Query.greaterThanEqual("created_at", since), Query.limit(4)] });
    if (recent.rows.length >= 3) return NextResponse.json({ error: "You have reached the event publishing limit. Try again tomorrow." }, { status: 429 });
    const now = new Date().toISOString();
    const row = await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: ID.unique(), data: { ...event, host_user_id: user.$id, emoji: "📅", status: "pending_review", created_at: now, updated_at: now } });
    return NextResponse.json({ submitted: true, eventId: String(row.$id), message: "Your event was submitted for review and is not public yet." }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Event submission failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Event publishing is not configured or temporarily unavailable." }, { status: 503 });
  }
}
