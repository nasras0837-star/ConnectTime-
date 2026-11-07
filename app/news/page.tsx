"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const categories = [
  { id: "For You", icon: "✨", description: "A mix of stories from around the world" },
  { id: "Politics", icon: "🏛️", description: "Government, elections, policy, and world affairs" },
  { id: "Sports", icon: "🏆", description: "Scores, teams, athletes, and major competitions" },
  { id: "Entertainment", icon: "🎬", description: "Movies, television, music, and celebrity culture" },
  { id: "World", icon: "🌍", description: "Global headlines and important developments" },
  { id: "Business", icon: "📈", description: "Companies, markets, and the economy" },
  { id: "Technology", icon: "💡", description: "Science, innovation, and digital culture" },
];

const previews = [
  { category: "Politics", icon: "🏛️", title: "Politics & public policy", summary: "Follow government decisions, elections, policy debates, and public affairs from local communities to the international stage.", tag: "Politics desk", tone: "newsPurple" },
  { category: "Sports", icon: "🏆", title: "Sports & competition", summary: "Keep up with leagues, tournaments, standout athletes, match analysis, and the stories behind the biggest competitions.", tag: "Sports desk", tone: "newsBlue" },
  { category: "Entertainment", icon: "🎬", title: "Entertainment & culture", summary: "Explore film and television releases, music, creators, award shows, and the conversations shaping popular culture.", tag: "Entertainment desk", tone: "newsPink" },
  { category: "World", icon: "🌍", title: "Around the world", summary: "Discover international reporting, regional developments, and perspectives from communities across the globe.", tag: "World desk", tone: "newsTeal" },
  { category: "Business", icon: "📈", title: "Business & economy", summary: "Explore company news, entrepreneurship, markets, jobs, and economic trends that affect everyday life.", tag: "Business desk", tone: "newsGold" },
  { category: "Technology", icon: "💡", title: "Technology & innovation", summary: "Read about new products, science, AI, cybersecurity, and the ideas changing how people live and work.", tag: "Technology desk", tone: "newsIndigo" },
];

export default function NewsPage() {
  const [active, setActive] = useState("For You");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => previews.filter((item) => {
    const categoryMatch = active === "For You" || item.category === active;
    const queryMatch = !query || `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  }), [active, query]);

  return <main className="newsPage">
    <header className="newsHeader">
      <Link href="/" className="newsBrand"><img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" /></Link>
      <nav><Link href="/">Home</Link><Link href="/videos">Video Tube</Link><Link href="/chat-rooms">Chat Rooms</Link><Link className="newsJoin" href="/signup">Join ConnectTime ↗</Link></nav>
    </header>
    <section className="newsHero">
      <div className="newsHeroCopy">
        <span>🌐 CONNECTTIME NEWS & STORIES</span>
        <h1>Stay curious.<br/><em>Stay connected.</em></h1>
        <p>Explore the stories shaping our world—from politics and sports to entertainment, business, and technology.</p>
        <div className="newsHeroStats"><span>🌍 International perspective</span><span>🧭 Topic-based discovery</span><span>💬 Community conversation</span></div>
      </div>
      <div className="newsHeroArt" aria-hidden="true"><span>🌍</span><b>NEWS<br/>AROUND<br/>THE WORLD</b><i>✦</i></div>
    </section>
    <section className="newsContent">
      <div className="newsHeading"><div><span>THE NEWSROOM</span><h2>Explore your news feed</h2><p>Choose a section to explore stories by topic.</p></div><label className="newsSearch">⌕ <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news topics..." /></label></div>
      <div className="newsTabs" role="tablist" aria-label="News categories">
        {categories.map((item) => <button key={item.id} type="button" role="tab" aria-selected={active === item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}><span>{item.icon}</span>{item.id}</button>)}
      </div>
      <div className="newsSectionIntro"><div><span>{categories.find((item) => item.id === active)?.icon} &nbsp; {active.toUpperCase()}</span><h2>{active === "For You" ? "Stories worth exploring" : `${active} news`}</h2><p>{categories.find((item) => item.id === active)?.description}</p></div><small>{filtered.length} {filtered.length === 1 ? "section" : "sections"}</small></div>
      {filtered.length ? <div className="newsGrid">{filtered.map((item) => <article className={`newsCard ${item.tone}`} key={item.category}><div className="newsCardVisual"><span>{item.icon}</span><small>{item.category}</small><i>✦</i></div><div className="newsCardBody"><span>{item.tag}</span><h3>{item.title}</h3><p>{item.summary}</p><div className="newsCardFoot"><small>Section preview · Live headlines pending</small><b>Explore section ↗</b></div></div></article>)}</div> : <div className="newsEmpty">No matching news sections. Try another search.</div>}
      <div className="newsProviderNote"><b>📰 ConnectTime News preview</b><p>These are category previews, not breaking-news headlines. Live articles, publisher attribution, timestamps, and source links will appear when the licensed news feed is connected.</p></div>
    </section>
    <footer className="newsFooter">© {new Date().getFullYear()} ConnectTime · News, perspectives, and community · Adults 18+</footer>
  </main>;
}
