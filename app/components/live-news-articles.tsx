"use client";

import { useCallback, useEffect, useState } from "react";

type Category = "World" | "U.S." | "Business" | "Technology" | "Sports" | "Entertainment";
type Article = { id: string; title: string; summary: string; url: string; source: string; published: string; category: Category };
const categories: Category[] = ["World", "U.S.", "Business", "Technology", "Sports", "Entertainment"];
const queries: Record<Category, string> = {
  World: "world news",
  "U.S.": "United States news",
  Business: "business markets economy",
  Technology: "technology science",
  Sports: "sports",
  Entertainment: "entertainment culture",
};

function clean(value: unknown) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&#39;/gi, "'").replace(/\s+/g, " ").trim();
}

export default function LiveNewsArticles() {
  const [category, setCategory] = useState<Category | "Top stories">("Top stories");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (selected: Category | "Top stories") => {
    setLoading(true);
    setError("");
    const selectedCategories = selected === "Top stories" ? categories : [selected];
    try {
      const results = await Promise.all(selectedCategories.map(async (topic) => {
        const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(queries[topic])}&hl=en-US&gl=US&ceid=US:en`;
        const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`;
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error("A news feed could not be reached.");
        const data = await response.json() as { status?: string; items?: Array<{ title?: string; description?: string; link?: string; pubDate?: string; author?: string }>; feed?: { title?: string } };
        if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("A news feed returned an invalid response.");
        return data.items.map((item, index): Article | null => {
          const url = item.link ?? "";
          if (!/^https:\/\//i.test(url)) return null;
          return {
            id: url || `${topic}-${index}`,
            title: clean(item.title),
            summary: clean(item.description).slice(0, 240),
            url,
            source: clean(item.author || data.feed?.title || topic),
            published: item.pubDate || "",
            category: topic,
          };
        }).filter((item): item is Article => Boolean(item?.title));
      }));
      const unique = new Map<string, Article>();
      results.flat().forEach((item) => { if (!unique.has(item.url)) unique.set(item.url, item); });
      const sorted = [...unique.values()].sort((a, b) => (Date.parse(b.published) || 0) - (Date.parse(a.published) || 0));
      setArticles(sorted);
      setUpdated(new Date().toISOString());
      if (!sorted.length) setError("No headlines were returned. Please refresh in a moment.");
    } catch {
      setError("The live news service is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("Top stories");
    const timer = window.setInterval(() => { void load("Top stories"); }, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const visible = category === "Top stories" ? articles : articles.filter((article) => article.category === category);

  return (
    <section className="ctLiveNewsArticles" aria-labelledby="ct-live-news-articles-title">
      <div className="ctLiveNewsArticlesHead">
        <div><span className="ctHomeEyebrow">CONNECT NEWS DESK · LIVE UPDATES</span><h2 id="ct-live-news-articles-title">The latest stories, as they develop.</h2><p>Current headlines from public news feeds. Choose a topic and read the full report from its publisher.</p></div>
        <button type="button" onClick={() => void load(category)} disabled={loading}>↻ {loading ? "Updating…" : "Refresh news"}</button>
      </div>
      <div className="ctLiveNewsArticleFilters" role="group" aria-label="Filter articles by topic">
        {(["Top stories", ...categories] as const).map((topic) => <button key={topic} type="button" className={category === topic ? "active" : ""} aria-pressed={category === topic} onClick={() => { setCategory(topic); void load(topic); }}>{topic}</button>)}
      </div>
      <p className="ctLiveNewsArticleStatus" role="status" aria-live="polite">{loading ? "Fetching the latest headlines…" : error || (updated ? `Updated ${new Date(updated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · refreshes automatically every 5 minutes` : "News feed ready.")}</p>
      {visible.length > 0 && <div className="ctLiveNewsArticleGrid">{visible.slice(0, 18).map((article) => <article key={article.id} className="ctLiveNewsArticleCard"><div className="ctLiveNewsArticleMeta"><span>{article.source || article.category}</span><time dateTime={article.published}>{article.published ? new Date(article.published).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Latest"}</time></div><h3>{article.title}</h3><p>{article.summary || "Open the publisher’s page to read the full report."}</p><a href={article.url} target="_blank" rel="noopener noreferrer">Read article ↗</a></article>)}</div>}
      <p className="ctLiveNewsArticleDisclaimer">Headlines and summaries are supplied by external publishers through Google News RSS and a public RSS conversion service. Follow the link to read each original article. Availability and publication times depend on the source feeds; Connect does not own or independently verify third-party reporting.</p>
    </section>
  );
}
