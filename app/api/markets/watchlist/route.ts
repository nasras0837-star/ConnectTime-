import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { communitySafetyStore, currentCommunityMember, sameOrigin } from "@/lib/community-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SYMBOLS = 30;
const SYMBOL_PATTERN = /^[A-Z0-9._-]{1,15}:[A-Z0-9._-]{1,15}$/;

function table() {
  const tableId = process.env.APPWRITE_MARKET_WATCHLIST_TABLE_ID;
  if (!tableId) throw new Error("Market watchlist table is not configured.");
  return { ...communitySafetyStore(), tableId };
}

function cleanSymbols(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_SYMBOLS) return null;
  const symbols = value.map(item => typeof item === "string" ? item.trim().toUpperCase() : "");
  if (symbols.some(item => !SYMBOL_PATTERN.test(item))) return null;
  return [...new Set(symbols)];
}

export async function GET() {
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in to access your saved watchlist." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const s = table();
    try {
      const row = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
      if (row.user_id !== user.$id) return NextResponse.json({ error: "Watchlist ownership check failed." }, { status: 403 });
      let symbols: unknown = [];
      try { symbols = JSON.parse(String(row.symbols_json || "[]")); } catch { symbols = []; }
      return NextResponse.json({ symbols: cleanSymbols(symbols) || [] }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === 404) {
        return NextResponse.json({ symbols: [] }, { headers: { "Cache-Control": "no-store" } });
      }
      throw error;
    }
  } catch (error) {
    console.error("Market watchlist load failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Account watchlist storage is unavailable. Check the Appwrite table configuration." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  const user = await currentCommunityMember();
  if (!user) return NextResponse.json({ error: "Sign in before saving a watchlist." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid watchlist payload." }, { status: 400 }); }
  const symbols = cleanSymbols(body.symbols);
  if (!symbols) return NextResponse.json({ error: "Use up to 30 valid exchange-qualified ticker symbols." }, { status: 400 });
  try {
    const s = table();
    const now = new Date().toISOString();
    const data = { user_id: user.$id, symbols_json: JSON.stringify(symbols), updated_at: now };
    try {
      const existing = await s.tablesDB.getRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id });
      if (existing.user_id !== user.$id) return NextResponse.json({ error: "Watchlist ownership check failed." }, { status: 403 });
      await s.tablesDB.updateRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: user.$id, data });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 404)) throw error;
      await s.tablesDB.createRow({ databaseId: s.databaseId, tableId: s.tableId, rowId: ID.custom(user.$id), data: { ...data, created_at: now } });
    }
    return NextResponse.json({ saved: true, symbols }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Market watchlist save failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Watchlist could not be saved. Check the Appwrite table columns and permissions." }, { status: 503 });
  }
}
