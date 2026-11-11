"use client";

import { useCallback, useEffect, useState } from "react";

type Category = "World" | "U.S." | "Business" | "Technology" | "Sports" | "Entertainment" | "Music" | "Gaming";
type Article = { id: string; title: string; summary: string; url: string; source: string; published: string; category: Category };
const categories: Category[] = ["World", "U.S.", "Business", "Technology", "Sports", "Entertainment", "Music", "Gaming"];
const apiCategory: Record<Category, string> = {
  World: "World",
  "U.S.": "Local",
  Business: "Business",
  Technology: "Technology",
  Sports: "Sports",
  Entertainment: "Entertainment",
  Music: "Music",
  Gaming: "Gaming",
};

export default function LiveNewsArticles({ compact = false }: { compact?: boolean }) {
  const [category, setCategory] = useState<Category | "Top stories">("Top stories");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (selected: Category | "Top stories") => {
    setLoading(true);
    setError("");
    try {
      const requested = selected === "Top stories" ? "For You" : apiCategory[selected];
      const response = await fetch(`/api/news?category=${encodeURIComponent(requested)}`, { cache: "no-store" });
      const data = await response.json() as {
        articles?: Array<{ id?: string; title?: string; description?: string; link?: string; publishedAt?: string; source?: string; category?: string }>;
        error?: string;
        updatedAt?: string;
      };
      if (!response.ok) throw new Error(data.error || "A news feed could not be reached.");
      const mapped = (data.articles || []).flatMap((item, index): Article[] => {
        if (!item.title || !item.link || !/^https?:\/\//i.test(item.link)) return [];
        const rawCategory = item.category || (selected === "Top stories" ? "World" : selected);
        const safeCategory = categories.includes(rawCategory as Category) ? rawCategory as Category : selected === "Top stories" ? "World" : selected;
        return [{
          id: item.id || item.link || `${safeCategory}-${index}`,
          title: item.title,
          summary: item.description || "",
          url: item.link,
          source: item.source || safeCategory,
          published: item.publishedAt || "",
          category: safeCategory,
        }];
      });
      setArticles(mapped);
      setUpdated(data.updatedAt || new Date().toISOString());
      if (!mapped.length) setError("No headlines were returned. Please refresh in a moment.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The live news service is temporarily unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void load("Top stories"); }, 0);
    const timer = window.setInterval(() => { void load("Top stories"); }, 5 * 60 * 1000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [load]);

  const visible = category === "Top stories" ? articles : articles.filter((article) => article.category === category);

  return (
    <section className={compact ? "ctLiveNewsArticles ctLiveNewsArticlesCompact" : "ctLiveNewsArticles"} aria-labelledby="ct-live-news-articles-title">
      <div className="ctLiveNewsArticlesHead">
        <div><span className="ctHomeEyebrow">CONNECT NEWS DESK · LIVE HEADLINES</span><h2 id="ct-live-news-articles-title">{compact ? "Top headlines" : "The latest stories, as they develop."}</h2><p>Current headlines from public news feeds. Choose a topic and read the full report from its publisher.</p></div>
        <button type="button" onClick={() => void load(category)} disabled={loading}>↻ {loading ? "Updating…" : "Refresh news"}</button>
      </div>
      <div className="ctLiveNewsArticleFilters" role="group" aria-label="Filter articles by topic">
        {(["Top stories", ...categories] as const).map((topic) => <button key={topic} type="button" className={category === topic ? "active" : ""} aria-pressed={category === topic} onClick={() => { setCategory(topic); void load(topic); }}>{topic}</button>)}
      </div>
      <p className="ctLiveNewsArticleStatus" role="status" aria-live="polite">{loading ? "Fetching the latest headlines…" : error || (updated ? `Updated ${new Date(updated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · refreshes automatically every 5 minutes` : "News feed ready.")}</p>
      {visible.length > 0 && <div className="ctLiveNewsArticleGrid">{visible.slice(0, compact ? 4 : 18).map((article) => <article key={article.id} className="ctLiveNewsArticleCard"><div className="ctLiveNewsArticleMeta"><span>{article.source || article.category}</span><time dateTime={article.published}>{article.published ? new Date(article.published).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Latest"}</time></div><h3>{article.title}</h3><p>{article.summary || "Open the publisher’s page to read the full report."}</p><a href={article.url} target="_blank" rel="noopener noreferrer">Read article ↗</a></article>)}</div>}
      <p className="ctLiveNewsArticleDisclaimer">Headlines and summaries are supplied by external publishers and public RSS feeds. Follow the link to read each original article. Availability and publication times depend on the source feeds; Connect does not own or independently verify third-party reporting.</p>
    </section>
  );
}
