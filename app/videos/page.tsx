"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Video = { id: string; title: string; creator: string; category: string; views: string; duration: string; description: string };
type Signals = { likes: string[]; watched: string[]; hidden: string[]; categoryScores: Record<string, number> };
const videos: Video[] = [
  { id: "jfKfPfyJRdk", title: "Relaxing nature scenes • 4K", creator: "Nature & Calm", category: "Nature", views: "2.4M", duration: "LIVE", description: "A peaceful stream of landscapes and ambient sounds." },
  { id: "ScMzIvxBSi4", title: "Learn something new in 5 minutes", creator: "Curiosity Lab", category: "Learning", views: "840K", duration: "5:02", description: "Short explainers that make big ideas approachable." },
  { id: "ysz5S6PUM-U", title: "Creative inspiration & ideas", creator: "The Creator Studio", category: "Creative", views: "320K", duration: "12:18", description: "A fresh dose of inspiration for your next project." },
  { id: "LXb3EKWsInQ", title: "Beautiful places around the world", creator: "Travel Stories", category: "Travel", views: "1.1M", duration: "8:44", description: "Explore destinations and cultures around the globe." },
  { id: "kJQP7kiw5Fk", title: "Music to brighten your day", creator: "Music Mix", category: "Music", views: "6.8M", duration: "3:48", description: "A popular music pick from the community." },
  { id: "aqz-KE-bpKQ", title: "Technology, explained simply", creator: "Tech Everyday", category: "Technology", views: "510K", duration: "9:26", description: "Technology trends and practical tips." },
];
const categories = ["For you", "Trending", "Learning", "Music", "Travel", "Technology", "Nature", "Creative"];
const blankSignals: Signals = { likes: [], watched: [], hidden: [], categoryScores: {} };
const readSignals = (): Signals => {
  try { return { ...blankSignals, ...JSON.parse(localStorage.getItem("ct-video-signals") || "{}") }; }
  catch { return blankSignals; }
};

export default function VideosPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("For you");
  const [interests, setInterests] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [signals, setSignals] = useState<Signals>(blankSignals);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Defer browser-only preference hydration until after the initial render.
    queueMicrotask(() => {
      try {
        setInterests(JSON.parse(localStorage.getItem("ct-video-interests") || "[]"));
        setHistory(JSON.parse(localStorage.getItem("ct-video-searches") || "[]"));
        setSignals(readSignals());
      } catch { /* Ignore malformed local preferences. */ }
      setReady(true);
    });
  }, []);
  const saveSignals = (next: Signals) => { setSignals(next); localStorage.setItem("ct-video-signals", JSON.stringify(next)); };
  const submitSearch = (term = query) => {
    const clean = term.trim().toLowerCase();
    if (!clean) return;
    const nextHistory = [clean, ...history.filter((item) => item !== clean)].slice(0, 12);
    setHistory(nextHistory); localStorage.setItem("ct-video-searches", JSON.stringify(nextHistory));
    const matched = categories.slice(1).find((category) => clean.includes(category.toLowerCase()));
    if (matched) {
      const nextInterests = [matched, ...interests.filter((item) => item !== matched)].slice(0, 8);
      setInterests(nextInterests); localStorage.setItem("ct-video-interests", JSON.stringify(nextInterests));
      saveSignals({ ...signals, categoryScores: { ...signals.categoryScores, [matched]: (signals.categoryScores[matched] || 0) + 2 } });
    }
  };
  const markWatched = (video: Video) => {
    if (signals.watched.includes(video.id)) return;
    saveSignals({ ...signals, watched: [video.id, ...signals.watched].slice(0, 40), categoryScores: { ...signals.categoryScores, [video.category]: (signals.categoryScores[video.category] || 0) + 1 } });
  };
  const toggleLike = (video: Video) => {
    const liked = signals.likes.includes(video.id);
    saveSignals({ ...signals, likes: liked ? signals.likes.filter((id) => id !== video.id) : [video.id, ...signals.likes], categoryScores: { ...signals.categoryScores, [video.category]: Math.max(0, (signals.categoryScores[video.category] || 0) + (liked ? -3 : 3)) } });
  };
  const hideVideo = (video: Video) => saveSignals({ ...signals, hidden: [...signals.hidden, video.id], categoryScores: { ...signals.categoryScores, [video.category]: Math.max(0, (signals.categoryScores[video.category] || 0) - 3) } });
  const feed = useMemo(() => {
    let list = videos.filter((video) => !signals.hidden.includes(video.id));
    if (active !== "For you" && active !== "Trending") list = list.filter((video) => video.category === active);
    if (query.trim()) list = list.filter((video) => (video.title + video.creator + video.category + video.description).toLowerCase().includes(query.toLowerCase()));
    if (active === "For you") list.sort((a, b) => {
      const score = (video: Video) => (signals.categoryScores[video.category] || 0) + (interests.includes(video.category) ? 2 : 0) + (signals.likes.includes(video.id) ? 4 : 0) - (signals.watched.includes(video.id) ? 0.5 : 0);
      return score(b) - score(a);
    });
    return list;
  }, [active, interests, query, signals]);
  return <main className="videoShell">
    <header className="videoHeader"><Link className="videoBrand" href="/" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={112} height={73} priority className="ctVideoLogo"/></Link><nav><Link href="/">Home</Link><Link href="/account">My account</Link></nav></header>
    <section className="videoIntro"><div className="videoEyebrow">CONNECTTIME VIDEO TUBE</div><h1>Connect. Discover.<br/><span>Watch what moves you.</span></h1><p>Welcome to ConnectTime Video Tube—discover creators, entertainment, learning, music, travel, and ideas from around the world.</p>
      <form className="videoSearch" onSubmit={(event) => {event.preventDefault(); submitSearch();}}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos, creators, or interests…" aria-label="Search videos"/><button type="submit">Search</button></form>
      {history.length > 0 && <div className="searchHistory"><span>Recent searches</span>{history.slice(0,4).map((item) => <button key={item} onClick={() => {setQuery(item); submitSearch(item);}}>{item}</button>)}</div>}
    </section>
    <section className="videoFeed"><div className="videoFilters">{categories.map((category) => <button key={category} className={active === category ? "selected" : ""} onClick={() => setActive(category)}>{category}</button>)}</div>
      {ready && <p className="interestNote">Personalized using searches, likes and watch history · {signals.likes.length} liked · {signals.watched.length} watched</p>}
      <div className="videoGrid">{feed.map((video) => <article className="videoCard" key={video.id}><div className="videoFrame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.id}`} title={video.title} loading="lazy" onLoad={() => markWatched(video)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><span className="duration">{video.duration}</span></div><div className="videoMeta"><span className="videoCategory">{video.category}</span><h2>{video.title}</h2><p>{video.creator} · {video.views} views</p><small>{video.description}</small><div className="videoActions"><button className={signals.likes.includes(video.id) ? "liked" : ""} onClick={() => toggleLike(video)} aria-pressed={signals.likes.includes(video.id)}>{signals.likes.includes(video.id) ? "♥ Liked" : "♡ Like"}</button><button onClick={() => hideVideo(video)}>Not interested</button></div></div></article>)}</div>
      {feed.length === 0 && <div className="emptyVideos">No videos match. Try another topic or reset recommendations.</div>}
      <div className="recommendationInfo"><strong>How your feed learns</strong><p>Searches add interest signals, likes boost similar topics, video opens add watch signals, and “Not interested” lowers a topic and hides that video. Signals are saved on this device for this prototype.</p><button onClick={() => {saveSignals(blankSignals);setInterests([]);setHistory([]);localStorage.removeItem("ct-video-interests");localStorage.removeItem("ct-video-searches");}}>Reset my recommendations</button></div>
      <p className="feedDisclaimer">Sample YouTube embeds only. This prototype does not measure actual watch duration or sync preferences across devices; account-based recommendations require authenticated backend storage.</p>
    </section><footer className="videoFooter">© {new Date().getFullYear()} ConnectTime · Adults 18+</footer>
  </main>;
}
