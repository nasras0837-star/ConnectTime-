import { NextResponse } from "next/server";
import { checkMemberAccess } from "@/lib/member-access";
import { currentCommunityMember } from "@/lib/community-safety";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedSort = new Set(["clickcount", "votes", "bitrate", "name"]);
const clean = (value: string | null, max = 80) => (value || "").trim().slice(0, max);

function safeHttpsUrl(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const member = await currentCommunityMember();
  if (!member) return NextResponse.json({ error: "Sign in to browse radio stations." }, { status: 401 });
  const access = await checkMemberAccess();
  if (!access.allowed) return NextResponse.json({ error: "Verified adult membership with an active account is required." }, { status: access.status });
  const params = new URL(request.url).searchParams;
  const country = clean(params.get("country"), 80);
  const language = clean(params.get("language"), 60);
  const name = clean(params.get("q"), 100);
  const limit = Math.min(100, Math.max(10, Number(params.get("limit")) || 50));
  const sort = clean(params.get("sort"), 20);
  const search = new URLSearchParams({ hidebroken: "true", order: allowedSort.has(sort) ? sort : "clickcount", reverse: "true", limit: String(limit) });
  if (country) search.set("countrycode", country);
  if (language) search.set("language", language);
  if (name) search.set("name", name);
  try {
    const response = await fetch(`https://de1.api.radio-browser.info/json/stations/search?${search.toString()}`, {
      headers: { "User-Agent": "ConnectTime/1.0 (community radio directory)", Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Radio directory upstream unavailable");
    const rows = await response.json();
    const stations = Array.isArray(rows) ? rows.filter((s: Record<string, unknown>) => safeHttpsUrl(s.url_resolved) && s.name && s.stationuuid).map((s: Record<string, unknown>) => ({
      id: String(s.stationuuid || ""), name: String(s.name || "").trim(), country: String(s.country || ""),
      countryCode: String(s.countrycode || ""), language: String(s.language || ""), tags: String(s.tags || ""),
      codec: String(s.codec || ""), bitrate: Number(s.bitrate || 0), homepage: safeHttpsUrl(s.homepage),
      streamUrl: safeHttpsUrl(s.url_resolved), votes: Number(s.votes || 0),
    })) : [];
    return NextResponse.json({ stations, count: stations.length, source: "Radio Browser community directory" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Live radio directory is temporarily unavailable. Please retry." }, { status: 502 });
  }
}
