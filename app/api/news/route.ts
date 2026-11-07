import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 120;

type NewsCategory = "World" | "Politics" | "Sports" | "Music" | "Entertainment" | "Business" | "Technology" | "Science" | "Gaming" | "Local" | "Nearby";
type Feed = { label: string; url: string; category: NewsCategory };

const SEARCH_TERMS: Record<NewsCategory, string> = {
  World: "world news",
  Politics: "politics government elections",
  Sports: "sports latest scores leagues",
  Music: "music news artists releases",
  Entertainment: "entertainment film television culture",
  Business: "business economy markets",
  Technology: "technology AI innovation",
  Science: "science environment research",
  Gaming: "video games gaming esports",
  Local: "local news United States",
  Nearby: "local news",
};

// Publisher RSS feeds are used alongside Google News search feeds so one
// provider outage does not leave the whole newsroom empty.
const PUBLISHER_FEEDS: Partial<Record<NewsCategory, Feed[]>> = {
  World: [
    { label: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "World" },
    { label: "The Guardian", url: "https://www.theguardian.com/world/rss", category: "World" },
    { label: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "World" },
  ],
  Politics: [
    { label: "BBC Politics", url: "https://feeds.bbci.co.uk/news/politics/rss.xml", category: "Politics" },
    { label: "NPR", url: "https://feeds.npr.org/1014/rss.xml", category: "Politics" },
  ],
  Sports: [
    { label: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/rss.xml", category: "Sports" },
  ],
  Business: [
    { label: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "Business" },
    { label: "NPR", url: "https://feeds.npr.org/1006/rss.xml", category: "Business" },
  ],
  Technology: [
    { label: "BBC Technology", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "Technology" },
    { label: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Technology" },
  ],
  Science: [
    { label: "BBC Science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", category: "Science" },
  ],
  Entertainment: [
    { label: "NPR Arts & Entertainment", url: "https://feeds.npr.org/1008/rss.xml", category: "Entertainment" },
  ],
  Music: [
    { label: "NPR Music", url: "https://feeds.npr.org/1039/rss.xml", category: "Music" },
  ],
  Gaming: [
    { label: "The Verge", url: "https://www.theverge.com/rss/index.xml", category: "Gaming" },
  ],
};

function decode(value: string) {
  return value
    .replace(/<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>/g, "$1")
    .replace(/&#(\\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function readTag(xml: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
  const match = xml.match(new RegExp("<(?:[\\w.-]+:)?" + escaped + "\\b[^>]*>([\\s\\S]*?)</(?:[\\w.-]+:)?" + escaped + "\\s*>", "i"));
  return match ? decode(match[1]) : "";
}

function clean(value: string) {
  return decode(value).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
}

function parseFeed(xml: string, category: NewsCategory, fallbackSource: string) {
  const entries = [...xml.matchAll(/<(?:item|entry)\\b[\\s\\S]*?<\\/(?:item|entry)\\s*>/gi)];
  return entries.map(({ 0: item }) => {
    const title = clean(readTag(item, "title"));
    const linkElement = item.match(/<link\\b[^>]*href=["']([^"']+)["'][^>]*\\/?\\s*>/i);
    const link = clean(readTag(item, "link")) || (linkElement ? decode(linkElement[1]) : "");
    const publishedAt = clean(readTag(item, "pubDate") || readTag(item, "published") || readTag(item, "updated") || readTag(item, "date"));
    const description = clean(readTag(item, "description") || readTag(item, "summary") || readTag(item, "encoded") || readTag(item, "content"));
    const source = clean(readTag(item, "source")) || fallbackSource;
    const image = item.match(/<(?:media:thumbnail|media:content)[^>]+url=["']([^"']+)["']/i)?.[1]
      || item.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1]
      || item.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || "";
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
  }).filter((article) => article.title && /^https?:\\/\\//i.test(article.link));
}

async function fetchFeed(feed: Feed): Promise<ReturnType<typeof parseFeed>> {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": "ConnectTimeNews/1.0 (+https://connecttime-sm.netlify.app)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${feed.label} returned HTTP ${response.status}`);
  const xml = await response.text();
  const articles = parseFeed(xml, feed.category, feed.label);
  if (!articles.length) throw new Error(`${feed.label} returned no readable stories`);
  return articles;
}

function googleNewsFeed(category: NewsCategory, lat?: number, lon?: number): Feed {
  const params = new URLSearchParams({
    q: category === "Nearby" && lat !== undefined && lon !== undefined
      ? `local news near ${lat.toFixed(2)},${lon.toFixed(2)} when:2d`
      : `${SEARCH_TERMS[category]} when:2d`,
    hl: "en-US",
    gl: "US",
    ceid: "US:en",
  });
  return { label: "Google News", url: `https://news.google.com/rss/search?${params.toString()}`, category };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = params.get("category") || "For You";
  const allowed: string[] = ["World", "Politics", "Sports", "Music", "Entertainment", "Business", "Technology", "Science", "Gaming", "Local", "Nearby"];
  if (requested !== "For You" && !allowed.includes(requested)) {
    return NextResponse.json({ articles: [], error: "Unknown news category." }, { status: 400 });
  }

  const categories: NewsCategory[] = requested === "For You"
    ? ["World", "Politics", "Sports", "Entertainment", "Business", "Technology"]
    : [requested as NewsCategory];

  let lat: number | undefined;
  let lon: number | undefined;
  if (requested === "Nearby") {
    lat = Number(params.get("lat"));
    lon = Number(params.get("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ articles: [], error: "Enable location access to see nearby headlines." }, { status: 400 });
    }
  }

  const feeds: Feed[] = categories.flatMap((category) => [
    ...(PUBLISHER_FEEDS[category] || []),
    googleNewsFeed(category, category === "Nearby" ? lat : undefined, category === "Nearby" ? lon : undefined),
  ]);
  const results = await Promise.allSettled(feeds.map(fetchFeed));
  let articles = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);

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
      { articles: [], error: "News providers did not return headlines. Please refresh in a moment.", category: requested },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { articles, updatedAt: new Date().toISOString(), category: requested, providersChecked: feeds.length },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
