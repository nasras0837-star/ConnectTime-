import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedSort = new Set(["clickcount", "votes", "bitrate", "name"]);
const clean = (value: string | null, max = 80) => (value || "").trim().slice(0, max);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secureUrl(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : ""; }
  catch { return ""; }
}

function normalize(rows: unknown) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
    .filter(s => s.lastcheckok === 1 && secureUrl(s.url_resolved) && s.name && s.stationuuid)
    .map(s => ({
      id: String(s.stationuuid), name: String(s.name).trim().slice(0, 180), country: String(s.country || "").slice(0, 80),
      countryCode: String(s.countrycode || "").slice(0, 2), language: String(s.language || "").slice(0, 120),
      tags: String(s.tags || "").slice(0, 180), codec: String(s.codec || "").slice(0, 16),
      bitrate: Number(s.bitrate || 0), homepage: secureUrl(s.homepage), streamUrl: secureUrl(s.url_resolved), votes: Number(s.votes || 0), clickcount: Number(s.clickcount || 0),
    }));
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ids = clean(params.get("ids"), 4000).split(",").filter(Boolean).slice(0, 100);
  if (params.has("ids")) {
    if (ids.length === 0 || ids.some(id => !uuidPattern.test(id))) return NextResponse.json({ error: "Invalid saved station list." }, { status: 400 });
    try {
      const response = await fetch("https://de1.api.radio-browser.info/json/stations/byuuid/" + ids.join(","), {
        headers: { "User-Agent": "ConnectTime/1.0 (community radio directory)", Accept: "application/json" },
        signal: AbortSignal.timeout(10000), cache: "no-store",
      });
      if (!response.ok) throw new Error("Radio directory upstream unavailable");
      const rows: unknown = await response.json();
      return NextResponse.json({ stations: normalize(rows) }, { headers: { "Cache-Control": "private, no-store" } });
    } catch {
      return NextResponse.json({ error: "Saved stations are temporarily unavailable. Please retry." }, { status: 502 });
    }
  }

  const country = clean(params.get("country"), 2).toUpperCase();
  const language = clean(params.get("language"), 60);
  const name = clean(params.get("q"), 100);
  const limit = Math.min(100, Math.max(10, Number(params.get("limit")) || 50));
  const sort = clean(params.get("sort"), 20);
  const search = new URLSearchParams({ hidebroken: "true", is_https: "true", order: allowedSort.has(sort) ? sort : "clickcount", reverse: "true", limit: String(limit) });
  if (/^[A-Z]{2}$/.test(country)) search.set("countrycode", country);
  if (language) search.set("language", language);
  if (name) search.set("name", name);
  try {
    const response = await fetch("https://de1.api.radio-browser.info/json/stations/search?" + search.toString(), {
      headers: { "User-Agent": "ConnectTime/1.0 (community radio directory)", Accept: "application/json" },
      signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    if (!response.ok) throw new Error("Radio directory upstream unavailable");
    const rows: unknown = await response.json();
    const stations = normalize(rows);
    return NextResponse.json({ stations, count: stations.length, source: "Radio Browser community directory" }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Live radio directory is temporarily unavailable. Please retry." }, { status: 502 });
  }
}
