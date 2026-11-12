import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedSort = new Set(["clickcount", "votes", "bitrate", "name"]);
const clean = (value: string | null, max = 80) => (value || "").trim().slice(0, max);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = clean(params.get("country"), 80);
  const language = clean(params.get("language"), 60);
  const name = clean(params.get("q"), 100);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 50));
  const sort = clean(params.get("sort"), 20);
  const base = new URLSearchParams({ hidebroken: "true", order: allowedSort.has(sort) ? sort : "clickcount", reverse: "true", limit: String(limit) });
  if (country) base.set("countrycode", country);
  if (language) base.set("language", language);
  const searches = name
    ? ["name", "country", "tag"].map((field) => {
        const search = new URLSearchParams(base);
        search.set(field, name);
        return search;
      })
    : [base];
  try {
    const responses = await Promise.all(searches.map((search) => fetch(`https://de1.api.radio-browser.info/json/stations/search?${search.toString()}`, {
      headers: { "User-Agent": "Connect/1.0 (community radio directory)", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    })));
    if (responses.some((response) => !response.ok)) throw new Error("Radio directory upstream unavailable");
    const resultSets = await Promise.all(responses.map((response) => response.json()));
    const rows = resultSets.flatMap((result) => Array.isArray(result) ? result : []);
    const uniqueRows = Array.from(new Map(rows.map((station: Record<string, unknown>) => [String(station.stationuuid || ""), station])).values());
    const stations = uniqueRows.filter((s: Record<string, unknown>) => s.url_resolved && s.name).slice(0, limit).map((s: Record<string, unknown>) => ({
      id: String(s.stationuuid || ""), name: String(s.name || "").trim(), country: String(s.country || ""),
      countryCode: String(s.countrycode || ""), language: String(s.language || ""), tags: String(s.tags || ""),
      codec: String(s.codec || ""), bitrate: Number(s.bitrate || 0), homepage: String(s.homepage || ""),
      streamUrl: String(s.url_resolved || ""), votes: Number(s.votes || 0),
    }));
    return NextResponse.json({ stations, count: stations.length, source: "Radio Browser community directory" }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ error: "Live radio directory is temporarily unavailable. Please retry." }, { status: 502 });
  }
}
