"use client";

import { useEffect, useMemo, useState } from "react";

type Topic = "News" | "Sports" | "Entertainment" | "Music" | "Business" | "Science & Space";
type Feed = { id: string; title: string; publisher: string; topic: Topic; country: string; channelId?: string; url: string; note: string };

const topics: Topic[] = ["News", "Sports", "Entertainment", "Music", "Business", "Science & Space"];
const feeds: Feed[] = [
  { id: "abc-news", title: "ABC News Live", publisher: "ABC News", topic: "News", country: "United States", channelId: "UCBi2mrWuNuyYy4gbM6fU18Q", url: "https://abcnews.go.com/Live", note: "Official live news coverage; stream availability can change." },
  { id: "nbc-now", title: "NBC News NOW", publisher: "NBC News", topic: "News", country: "United States", channelId: "UCeY0bbntWzzVIaj2z3QigXg", url: "https://www.nbcnews.com/now", note: "Continuous news service; some content may be region-restricted." },
  { id: "sky-news", title: "Sky News Live", publisher: "Sky News", topic: "News", country: "United Kingdom", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", url: "https://news.sky.com/watch-live", note: "Official live news channel; availability varies by region." },
  { id: "aljazeera", title: "Al Jazeera English Live", publisher: "Al Jazeera", topic: "News", country: "Qatar / Global", channelId: "UCNye-wNBqNL5ZzHSJj3l8Bg", url: "https://www.aljazeera.com/live", note: "Official international news stream." },
  { id: "france24", title: "France 24 English Live", publisher: "France 24", topic: "News", country: "France / Global", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", url: "https://www.france24.com/en/live", note: "Official international news stream." },
  { id: "bloomberg", title: "Bloomberg Television", publisher: "Bloomberg", topic: "Business", country: "United States", channelId: "UCIALMKvObZNtJ6AmdCLP7Lg", url: "https://www.bloomberg.com/live", note: "Business and market coverage; programming may rotate." },
  { id: "nasa", title: "NASA Live", publisher: "NASA", topic: "Science & Space", country: "United States", url: "https://www.nasa.gov/nasatv/", note: "Space missions and public events when scheduled." },
  { id: "espn", title: "ESPN Live Coverage", publisher: "ESPN", topic: "Sports", country: "United States", url: "https://www.espn.com/watch/", note: "Official sports video hub. Live games may require a paid TV or streaming subscription." },
  { id: "olympics", title: "Olympics Video", publisher: "Olympics", topic: "Sports", country: "Global", url: "https://olympics.com/en/live", note: "Official event coverage and highlights; live rights vary by country and event." },
  { id: "nba", title: "NBA Video", publisher: "NBA", topic: "Sports", country: "United States / Global", url: "https://www.nba.com/watch", note: "Official NBA video and live-game options; subscriptions and blackout rules may apply." },
  { id: "bbc-ent", title: "BBC Entertainment", publisher: "BBC", topic: "Entertainment", country: "United Kingdom", url: "https://www.bbc.co.uk/iplayer", note: "Official programmes and live channels where licensed; UK account and location rules apply." },
  { id: "arte", title: "ARTE Live & Culture", publisher: "ARTE", topic: "Entertainment", country: "Europe", url: "https://www.arte.tv/en/live/", note: "Official culture, documentary and entertainment streams; programme rights vary." },
  { id: "kexp", title: "KEXP Live Sessions", publisher: "KEXP", topic: "Music", country: "United States", url: "https://www.youtube.com/@kexp/live", note: "Official music performances and live sessions; stream schedule varies." },
  { id: "npr-music", title: "NPR Music", publisher: "NPR", topic: "Music", country: "United States", url: "https://www.youtube.com/@nprmusic", note: "Official music performances, interviews and sessions; not a continuous live channel." }
];

const storageKey = "connecttime-live-feed-preferences";

export default function LiveInterestFeed() {
  const [selected, setSelected] = useState<Topic[]>(["News", "Sports", "Entertainment"]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Saved on this device");

  useEffect(() => {
    let active = true;
    async function loadPreferences() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        // Hydrate browser-local preferences after the first client render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(saved) && active) setSelected(saved.filter((v): v is Topic => topics.includes(v)));
      } catch { /* Ignore malformed local preferences. */ }
      try {
        const response = await fetch("/api/live-feed/preferences", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.topics)) {
            const remote = data.topics.filter((v: unknown): v is Topic => typeof v === "string" && topics.includes(v as Topic));
            if (active) {
              setSelected(remote);
              localStorage.setItem(storageKey, JSON.stringify(remote));
              setSyncStatus("Synced to your ConnectTime account");
            }
          }
        } else if (response.status === 401) {
          if (active) setSyncStatus("Sign in to sync across devices");
        } else if (active) setSyncStatus("Using this device until account sync is configured");
      } catch {
        if (active) setSyncStatus("Using this device until account sync is available");
      } finally {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (active) setReady(true);
      }
    }
    void loadPreferences();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => feeds.filter(feed => selected.includes(feed.topic)), [selected]);

  function toggle(topic: Topic) {
    const next = selected.includes(topic) ? selected.filter(item => item !== topic) : [...selected, topic];
    setSelected(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setSyncStatus("Saving to your account…");
    void fetch("/api/live-feed/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topics: next })
    }).then(response => {
      if (response.ok) setSyncStatus("Synced to your ConnectTime account");
      else if (response.status === 401) setSyncStatus("Saved on this device · sign in to sync");
      else setSyncStatus("Saved on this device · account sync unavailable");
    }).catch(() => setSyncStatus("Saved on this device · account sync unavailable"));
  }

  return <section className="ctLiveInterest" aria-labelledby="ct-live-interest-title">
    <div className="ctLiveInterestHead"><div><span className="ctLiveEyebrow">YOUR PERSONAL LIVE FEED</span><h2 id="ct-live-interest-title">Watch what you&apos;re into</h2><p>Choose your interests. ConnectTime brings together official live channels and broadcaster video hubs.</p></div><span className="ctLiveCount">◉ Curated sources</span></div>
    <div className="ctLiveTopics" role="group" aria-label="Choose live feed interests">{topics.map(topic => <button key={topic} type="button" onClick={() => toggle(topic)} className={selected.includes(topic) ? "active" : ""} aria-pressed={selected.includes(topic)}>{topic}</button>)}</div><p className="ctLiveSyncStatus" role="status">{syncStatus}</p>
    {!ready ? <p className="ctLiveNote">Loading your interests…</p> : visible.length ? <div className="ctLiveGrid">{visible.map(feed => <article className="ctLiveCard" key={feed.id}>
      <div className="ctLiveCardTop"><span>● {feed.topic}</span><span>{feed.country}</span></div>
      <h3>{feed.title}</h3><p className="ctLivePublisher">{feed.publisher}</p><p>{feed.note}</p>
      {feed.channelId ? <>{loaded.includes(feed.id) ? <div className="ctLivePlayer"><iframe src={`https://www.youtube-nocookie.com/embed/live_stream?channel=${feed.channelId}`} title={feed.title} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/></div> : <button className="ctLivePlay" type="button" onClick={() => setLoaded(current => [...current, feed.id])}>▶ Load official live player</button>}</> : <a className="ctLivePlay" href={feed.url} target="_blank" rel="noopener noreferrer">Open official video feed ↗</a>}
      <a className="ctLiveSource" href={feed.url} target="_blank" rel="noopener noreferrer">Broadcaster&apos;s official site ↗</a>
    </article>)}</div> : <div className="ctLiveEmpty">Choose one or more topics above to build your live feed.</div>}
    <p className="ctLiveDisclaimer">Streams are published by their respective rights holders. A player may be offline, unavailable in your country, or disabled for embedding. Sports games and some entertainment programmes require a paid subscription; ConnectTime does not bypass regional or subscription restrictions. Players load only when you choose to open them.</p>
  </section>;
}
