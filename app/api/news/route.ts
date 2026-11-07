import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type NewsCategory = "World" | "Politics" | "Sports" | "Music" | "Entertainment" | "Business" | "Technology" | "Science" | "Gaming" | "Local" | "Nearby";

const SEARCH_TERMS: Record<NewsCategory, string> = {
  World: "world news",
  Politics: "politics government elections",
  Sports: "sports latest scores leagues",
  Music: "music news artists releases",
  Entertainment: "entertainment film television culture",
  Business: "business economy markets",
  Technology: "technology science AI innovation",
  Science: "science environment research",
  Gaming: "video games gaming esports",
  Local: "local news United States",
  Nearby: "local news",
};

const FALLBACK_FEEDS: Partial<Record<NewsCategory, { label: string; url: string }[]>> = {
  World: [{ label: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml" }],
  Politics: [{ label: "NPR", url: "https://feeds.npr.org/1014/rss.xml" }],
  Sports: [{ label: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml" }],
  Business: [{ label: "BBC News", url: "https://feeds.bbci.co.uk/news/business/rss.xml" }],
  Technology: [{ label: "BBC News", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" }],
  Science: [{ label: "BBC News", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" }],
};

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function readTag(xml: string, name: string) {
  const match = xml.match(new RegExp("<(?:[\\w.-]+:)?" + name + "\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?" + name + ">", "i"));
  return match ? decode(match[1]) : "";
}

function clean(value: string) {
  return decode(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseFeed(xml: string, category: string, fallbackSource: string) {
  const entries = [...xml.matchAll(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/gi)];
  return entries.map(({ 0: item }) => {
    const title = clean(readTag(item, "title"));
    const linkTag = item.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
    const link = clean(readTag(item, "link")) || (linkTag ? decode(linkTag[1]) : "");
    const publishedAt = clean(readTag(item, "pubDate") || readTag(item, "published") || readTag(item, "updated") || readTag(item, "date"));
    const description = clean(readTag(item, "description") || readTag(item, "summary") || readTag(item, "content:encoded"));
    const source = clean(readTag(item, "source")) || fallbackSource;
    const image = item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1]
      || item.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1]
      || item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] || "";
    return {
      id: link || title,
      title,
      link,
      description: description.slice(0, 420),
      publishedAt,
      source,
      category,
      image: image ? decode(image) : undefined,
    };
  }).filter((article) => article.title && /^https?:\/\//i.test(article.link));
}

async function fetchFeed(url: string, category: string, source: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ConnectTimeNews/1.0; +https://connecttime-sm.netlify.app)" , Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 300 },
  });
  if (!response.ok) throw new Error(`News provider returned ${response.status}`);
  const xml = await response.text();
  const articles = parseFeed(xml, category, source);
  if (!articles.length) throw new Error("News provider returned no readable stories");
  return articles;
}

function googleNewsUrl(query: string, lat?: number, lon?: number) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  if (lat !== undefined && lon !== undefined) params.set("geo", `${lat},${lon},25km`);
  return `https://news.google.com/rss/search?${params.toString()}`;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = params.get("category") || "For You";
  const category = requested as NewsCategory;
  const allowed: string[] = ["World", "Politics", "Sports", "Music", "Entertainment", "Business", "Technology", "Science", "Gaming", "Local", "Nearby"];
  if (requested !== "For You" && !allowed.includes(requested)) {
    return NextResponse.json({ articles: [], error: "Unknown news category." }, { status: 400 });
  }

  let lat: number | undefined;
  let lon: number | undefined;
  if (requested === "Nearby") {
    lat = Number(params.get("lat"));
    lon = Number(params.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ articles: [], error: "Enable location access to see nearby headlines." }, { status: 400 });
    }
  }

  const categories: NewsCategory[] = requested === "For You"
    ? ["World", "Politics", "Sports", "Entertainment", "Business", "Technology"]
    : [category];

  const feeds = categories.map((key) => ({
    category: key,
    url: googleNewsUrl(SEARCH_TERMS[key], key === "Nearby" ? lat : undefined, key === "Nearby" ? lon : undefined),
    source: "Google News",
  }));

  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed.url, feed.category, feed.source)));
  let articles = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);

  // Use direct publisher feeds as a backup when a Google News topic feed is unavailable.
  if (articles.length === 0) {
    const backups = categories.flatMap((key) => FALLBACK_FEEDS[key] || []);
    const backupResults = await Promise.allSettled(backups.map((feed) => fetchFeed(feed.url, requested === "For You" ? "World" : requested, feed.label)));
    articles = backupResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  }

  const seen = new Set<string>();
  articles = articles
    .filter((article) => {
      const key = article.link.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
    .slice(0, requested === "For You" ? 36 : 30);

  if (!articles.length) {
    return NextResponse.json(
      { articles: [], error: "External news providers are temporarily unavailable. Please try again shortly.", category: requested },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { articles, updatedAt: new Date().toISOString(), category: requested },
    { headers: { "Cache-Control": requested === "Nearby" ? "private, no-store" : "public, s-maxage=300, stale-while-revalidate=900" } },
  );
}
