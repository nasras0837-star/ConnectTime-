import { NextResponse } from "next/server";

export const revalidate = 300;
export const runtime = "nodejs";

const FEEDS: Record<string, { label: string; urls: string[] }> = {
  Politics: { label: "NPR Politics", urls: ["https://feeds.npr.org/1014/rss.xml"] },
  Sports: { label: "BBC Sport", urls: ["https://feeds.bbci.co.uk/sport/rss.xml"] },
  Music: { label: "BBC Music", urls: ["https://feeds.bbci.co.uk/news/entertainment_and_arts/music/rss.xml"] },
  Entertainment: { label: "BBC Entertainment", urls: ["https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"] },
  World: { label: "BBC World", urls: ["https://feeds.bbci.co.uk/news/world/rss.xml"] },
  Business: { label: "BBC Business", urls: ["https://feeds.bbci.co.uk/news/business/rss.xml"] },
  Technology: { label: "BBC Technology", urls: ["https://feeds.bbci.co.uk/news/technology/rss.xml"] },
  Science: { label: "BBC Science", urls: ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"] },
  Gaming: { label: "BBC Technology", urls: ["https://feeds.bbci.co.uk/news/technology/rss.xml"] },
  Local: { label: "BBC UK", urls: ["https://feeds.bbci.co.uk/news/uk/rss.xml"] },
};
function decode(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
function tag(xml: string, name: string) {
  const match = xml.match(new RegExp("<(?:\\w+:)?"+name+"\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?"+name+">", "i"));
  return match ? decode(match[1].replace(/<[^>]+>/g, " ")) : "";
}
function stripHtml(value: string) { return decode(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category") || "For You";
  if (category === "Nearby") {
    const lat = Number(params.get("lat")), lon = Number(params.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return NextResponse.json({ articles: [], error: "Nearby news requires location permission." }, { status: 400 });
    const url = "https://news.google.com/rss/search?" + new URLSearchParams({ q: "news", geo: `${lat},${lon},25km`, hl: "en-US", gl: "US", ceid: "US:en" });
    try {
      const response = await fetch(url, { headers: { "User-Agent": "ConnectTimeNews/1.0 (RSS reader)" }, signal: AbortSignal.timeout(8000), next: { revalidate: 300 } });
      if (!response.ok) throw new Error("Nearby feed unavailable");
      const xml = await response.text();
      const articles = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
        const item = match[0], title = tag(item, "title"), link = tag(item, "link"), publishedAt = tag(item, "pubDate"), description = stripHtml(tag(item, "description"));
        return { id: link || title, title, link, description: description.slice(0, 360), publishedAt, source: "Google News · Nearby", category: "Nearby" };
      }).filter((a) => a.title && a.link.startsWith("https://")).slice(0, 30);
      return NextResponse.json({ articles, updatedAt: new Date().toISOString(), category }, { headers: { "Cache-Control": "private, no-store" } });
    } catch { return NextResponse.json({ articles: [], error: "Nearby headlines are temporarily unavailable." }, { status: 502 }); }
  }
  const keys = category === "For You" ? ["World", "Politics", "Sports", "Entertainment", "Music", "Business", "Technology"] : [category];
  const feeds = keys.flatMap((key) => FEEDS[key] ? FEEDS[key].urls.map((url) => ({ key, label: FEEDS[key].label, url })) : []);
  if (!feeds.length) return NextResponse.json({ articles: [], error: "Unknown news category" }, { status: 400 });
  const results = await Promise.allSettled(feeds.map(async (feed) => {
    const response = await fetch(feed.url, { headers: { "User-Agent": "ConnectTimeNews/1.0 (RSS reader)" }, signal: AbortSignal.timeout(8000), next: { revalidate: 300 } });
    if (!response.ok) throw new Error("Feed unavailable");
    const xml = await response.text();
    return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => {
      const item = match[0], title = tag(item, "title");
      const link = tag(item, "link") || item.match(/<link\s+href="([^"]+)"/i)?.[1] || "";
      const pubDate = tag(item, "pubDate") || tag(item, "published") || tag(item, "updated");
      const description = stripHtml(tag(item, "description") || tag(item, "summary"));
      const image = item.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] || item.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] || "";
      return { id: link || title, title, link, description: description.slice(0, 360), publishedAt: pubDate, source: feed.label, category: feed.key, image };
    }).filter((article) => article.title && article.link.startsWith("https://"));
  }));
  const articles = results.flatMap((r) => r.status === "fulfilled" ? r.value : []).sort((a,b) => (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0)).slice(0, 60);
  return NextResponse.json({ articles, updatedAt: new Date().toISOString(), category }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
}
