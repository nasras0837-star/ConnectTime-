import Link from "next/link";

const tiles = [
  { icon: "▶", title: "ConnectTime TV", desc: "Discover videos picked for you", href: "/videos", color: "pink" },
  { icon: "♧", title: "Friends", desc: "Connect with people around the world", href: "/signup", color: "blue" },
  { icon: "✧", title: "Match Maker", desc: "Meet people with shared interests", href: "/signup", color: "teal" },
  { icon: "▣", title: "Marketplace", desc: "Explore community finds", href: "/signup", color: "gold" },
  { icon: "✦", title: "News & Stories", desc: "See what's happening", href: "/signup", color: "violet" },
  { icon: "◉", title: "Live", desc: "Join conversations in real time", href: "/signup", color: "mint" },
];
const picks = [
  { emoji: "🌴", label: "Nature & travel", color: "tileMint" },
  { emoji: "🎵", label: "Music", color: "tilePink" },
  { emoji: "🎮", label: "Gaming", color: "tileBlue" },
  { emoji: "🧠", label: "Learning", color: "tileGold" },
  { emoji: "✨", label: "Creative", color: "tileLavender" },
];

export default function HomePage() {
  return <main className="vibrantHome">
    <header className="vHeader"><Link className="vLogo" href="/">🌐 Connect<span>Time</span></Link><div className="vSearch">⌕ <span>Search people, videos, topics…</span></div><nav><Link href="/login">Log in</Link><Link className="vJoin" href="/signup">Join free ↗</Link></nav></header>
    <div className="vLayout"><aside className="vSidebar"><Link className="vSideActive" href="/">⌂ <span>Home</span></Link><Link href="/videos">▶ <span>ConnectTime TV</span></Link><Link href="/signup">♧ <span>Friends</span></Link><Link href="/signup">▣ <span>Messages</span></Link><Link href="/signup">♡ <span>Match Maker</span></Link><Link href="/signup">▤ <span>Marketplace</span></Link><Link href="/signup">✦ <span>News</span></Link><Link href="/signup">◉ <span>Live</span></Link><div className="vAge"><span>🛡️</span><strong>18+ community</strong><small>Age eligibility required for full access.</small></div></aside>
    <section className="vMain"><div className="vHero"><div className="vHeroText"><span className="vPill">YOUR WORLD, YOUR PEOPLE</span><h1>Find your people.<br/><em>Share what you love.</em></h1><p>Build friendships, share interests, and discover communities from around the world.</p><div className="vHeroButtons"><Link href="/signup" className="vPrimary">✨ Get started free</Link><Link href="/videos" className="vSecondary">▶ Watch ConnectTime TV</Link></div></div><div className="vHeroArt"><div className="vOrb orbOne"/><div className="vOrb orbTwo"/><div className="vFloating">🌎</div><div className="vFloatText">A place to belong</div><div className="vMiniCard">🤝 <b>Shared interests.<br/>Real community.</b></div></div></div>
    <div className="vSectionHead"><div><span className="vEyebrow">EXPLORE WHAT YOU LOVE</span><h2>Explore your interests</h2></div><Link href="/videos">See all →</Link></div><div className="vInterestRow">{picks.map((x)=><Link href="/videos" className={`vInterest ${x.color}`} key={x.label}><span>{x.emoji}</span><b>{x.label}</b></Link>)}</div>
    <div className="vSectionHead"><div><span className="vEyebrow">ONE APP, MANY POSSIBILITIES</span><h2>Your ConnectTime shortcuts</h2></div></div><div className="vShortcutGrid">{tiles.map((x)=><Link href={x.href} className={`vShortcut ${x.color}`} key={x.title}><span className="vShortcutIcon">{x.icon}</span><div><h3>{x.title}</h3><p>{x.desc}</p></div><span className="vArrow">↗</span></Link>)}</div>
    <div className="vBottomCall"><div><strong>Ready to make your world bigger?</strong><p>Join the community and start exploring.</p></div><Link href="/signup">Create your account →</Link></div><footer className="vFooter">© {new Date().getFullYear()} ConnectTime · Watch • Chat • Connect · Adults 18+</footer></section></div>
  </main>;
}
