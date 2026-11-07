"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Video = { id: string; title: string; creator: string; category: string; views: string; duration: string; description: string };
const videos: Video[] = [
  { id: "jfKfPfyJRdk", title: "Relaxing nature scenes • 4K", creator: "Nature & Calm", category: "Nature", views: "2.4M", duration: "LIVE", description: "A peaceful stream of landscapes and ambient sounds." },
  { id: "ScMzIvxBSi4", title: "Learn something new in 5 minutes", creator: "Curiosity Lab", category: "Learning", views: "840K", duration: "5:02", description: "Short explainers that make big ideas approachable." },
  { id: "ysz5S6PUM-U", title: "Creative inspiration & ideas", creator: "The Creator Studio", category: "Creative", views: "320K", duration: "12:18", description: "A fresh dose of inspiration for your next project." },
  { id: "LXb3EKWsInQ", title: "Beautiful places around the world", creator: "Travel Stories", category: "Travel", views: "1.1M", duration: "8:44", description: "Explore destinations and cultures around the globe." },
  { id: "kJQP7kiw5Fk", title: "Music to brighten your day", creator: "Music Mix", category: "Music", views: "6.8M", duration: "3:48", description: "A popular music pick from the community." },
  { id: "aqz-KE-bpKQ", title: "Technology, explained simply", creator: "Tech Everyday", category: "Technology", views: "510K", duration: "9:26", description: "Technology trends and practical tips." },
];
const categories = ["For you", "Trending", "Learning", "Music", "Travel", "Technology", "Nature", "Creative"];

export default function VideosPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("For you");
  const [interests, setInterests] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => {
    try {
      setInterests(JSON.parse(localStorage.getItem("ct-video-interests") || "[]"));
      setHistory(JSON.parse(localStorage.getItem("ct-video-searches") || "[]"));
    } catch { /* Ignore malformed local preferences. */ }
  }, []);
  const submitSearch = (term = query) => {
    const clean = term.trim().toLowerCase();
    if (!clean) return;
    const next = [clean, ...history.filter((item) => item !== clean)].slice(0, 12);
    setHistory(next); localStorage.setItem("ct-video-searches", JSON.stringify(next));
    const matched = categories.slice(1).find((category) => clean.includes(category.toLowerCase()));
    if (matched && !interests.includes(matched)) {
      const nextInterests = [matched, ...interests].slice(0, 8);
      setInterests(nextInterests); localStorage.setItem("ct-video-interests", JSON.stringify(nextInterests));
    }
  };
  const feed = useMemo(() => {
    let list = [...videos];
    if (active !== "For you" && active !== "Trending") list = list.filter((video) => video.category === active);
    if (active === "For you" && interests.length) list.sort((a, b) => Number(interests.includes(b.category)) - Number(interests.includes(a.category)));
    if (query.trim()) list = list.filter((video) => (video.title + video.creator + video.category + video.description).toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [active, interests, query]);
  return <main className="videoShell">
    <header className="videoHeader"><Link className="videoBrand" href="/">Connect<span>Time</span></Link><nav><Link href="/">Home</Link><Link href="/account">My account</Link></nav></header>
    <section className="videoIntro"><div className="videoEyebrow">CONNECTTIME TV</div><h1>Watch what<br/><span>moves you.</span></h1><p>A video feed shaped by the topics you explore and search for.</p>
      <form className="videoSearch" onSubmit={(event) => {event.preventDefault(); submitSearch();}}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search videos, creators, or interests…" aria-label="Search videos"/><button type="submit">Search</button></form>
      {history.length > 0 && <div className="searchHistory"><span>Recent searches</span>{history.slice(0,4).map((item) => <button key={item} onClick={() => {setQuery(item); submitSearch(item);}}>{item}</button>)}</div>}
    </section>
    <section className="videoFeed"><div className="videoFilters">{categories.map((category) => <button key={category} className={active === category ? "selected" : ""} onClick={() => setActive(category)}>{category}</button>)}</div>
      {interests.length > 0 && <p className="interestNote">Your feed is learning from searches: {interests.join(" · ")}</p>}
      <div className="videoGrid">{feed.map((video) => <article className="videoCard" key={video.id}><div className="videoFrame"><iframe src={`https://www.youtube-nocookie.com/embed/${video.id}`} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><span className="duration">{video.duration}</span></div><div className="videoMeta"><span className="videoCategory">{video.category}</span><h2>{video.title}</h2><p>{video.creator} · {video.views} views</p><small>{video.description}</small></div></article>)}</div>
      {feed.length === 0 && <div className="emptyVideos">No videos match that search. Try another topic or category.</div>}
    <p className="feedDisclaimer">Demo feed with sample YouTube embeds. Personalization is stored in this browser only; account-wide recommendations and creator uploads need backend integration.</p>
    </section><footer className="videoFooter">© {new Date().getFullYear()} ConnectTime · Adults 18+</footer>
  </main>;
}
