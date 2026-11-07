"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Article = {
  id: string;
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  source: string;
  category: string;
};

const topics = ["For You", "Nearby", "World", "Politics", "Sports", "Entertainment", "Business", "Technology"];

export default function LiveNewsWidget() {
  const [topic, setTopic] = useState("For You");
  const [articles, setArticles] = useState<Article[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [geo, setGeo] = useState<{ lat: number; lon: number } | null>(null);
  const [geoMessage, setGeoMessage] = useState("");

  useEffect(() => {
    if (topic === "Nearby" && !geo) return;
    const controller = new AbortController();
    setBusy(true);
    setError("");
    const location = topic === "Nearby" && geo ? `&lat=${geo.lat}&lon=${geo.lon}` : "";
    fetch(`/api/news?category=${encodeURIComponent(topic)}${location}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "News feeds are temporarily unavailable.");
        return data;
      })
      .then((data) => setArticles(data.articles || []))
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [topic, refresh, geo]);

  useEffect(() => {
    const timer = window.setInterval(() => setRefresh((value) => value + 1), 300000);
    return () => window.clearInterval(timer);
  }, []);

  const enableNearby = () => {
    if (!navigator.geolocation) {
      setGeoMessage("Location is not supported by this browser.");
      return;
    }
    setGeoMessage("Waiting for your location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ lat: position.coords.latitude, lon: position.coords.longitude });
        setTopic("Nearby");
        setGeoMessage("Showing headlines near your location.");
      },
      () => setGeoMessage("Location permission was declined. You can still browse worldwide news."),
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const time = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Latest" : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <section className="homeLiveNews" aria-label="Live news">
      <div className="homeLiveNewsTop">
        <div>
          <span className="homeLiveEyebrow">CONNECTTIME NEWSROOM</span>
          <h2>What’s happening <em>now</em></h2>
          <p>Fresh headlines from external news publishers, grouped by topic.</p>
        </div>
        <Link href="/news">Explore all news ↗</Link>
      </div>
      <div className="homeLiveTabs" role="tablist" aria-label="News topics">
        {topics.map((item) => (
          <button key={item} type="button" role="tab" aria-selected={topic === item} className={topic === item ? "active" : ""} onClick={() => item === "Nearby" ? (setTopic("Nearby"), geo ? undefined : enableNearby()) : setTopic(item)}>
            {item === "Nearby" ? "📍 " : ""}{item}
          </button>
        ))}
      </div>
      {geoMessage && <p className="homeNewsFoot" aria-live="polite">{geoMessage}</p>}
      {busy ? (
        <div className="homeNewsStatus">🌐 Loading the latest headlines…</div>
      ) : error ? (
        <div className="homeNewsStatus">{error} <button type="button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div>
      ) : topic === "Nearby" && !geo ? (
        <div className="homeNewsStatus">Allow location access to load news near you. <button type="button" onClick={enableNearby}>Enable nearby news</button></div>
      ) : articles.length ? (
        <div className="homeLiveGrid">
          {articles.slice(0, 6).map((article) => (
            <article className="homeLiveCard" key={article.id}>
              <div className="homeLiveCardMeta"><span>{article.category}</span><small>{time(article.publishedAt)}</small></div>
              <h3><a href={article.link} target="_blank" rel="noopener noreferrer">{article.title}</a></h3>
              {article.description && <p>{article.description}</p>}
              <div className="homeLiveSource"><span>{article.source}</span><a href={article.link} target="_blank" rel="noopener noreferrer">Read story ↗</a></div>
            </article>
          ))}
        </div>
      ) : (
        <div className="homeNewsStatus">No headlines were returned for this topic. <button type="button" onClick={() => setRefresh((value) => value + 1)}>Refresh feed</button></div>
      )}
      <div className="homeNewsFoot"><span>Feeds refresh automatically every 5 minutes. Headlines link to their original publishers.</span><button type="button" onClick={() => setRefresh((value) => value + 1)}>↻ Refresh now</button></div>
    </section>
  );
}
