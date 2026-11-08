"use client";

import Link from "next/link";
import Image from "next/image";

const pillars = [
  { icon: "🌐", title: "One connected world", text: "Bring conversations, communities, culture and discovery into one welcoming digital space." },
  { icon: "🧭", title: "Find your corner", text: "Explore interests, meet people, and discover experiences that fit the way you connect." },
  { icon: "🛡️", title: "Safety comes first", text: "Adult-only member access, clear community expectations, and tools to report concerns are foundational—not optional." },
];

const experiences = [
  ["💬", "Community", "Share updates, join groups, and take part in conversations."],
  ["🤝", "Connections", "Build friendships and explore Match Maker at your own pace."],
  ["📺", "Watch & listen", "Discover Free TV, Free Radio, and ConnectTime Video Tube."],
  ["🗓️", "Meet in real life", "Explore community events and gatherings around shared interests."],
];

export default function AboutPage() {
  return <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f4f7ff 0%,#fff 55%)", color: "#18213b" }}>
    <header style={{ maxWidth: 1160, margin: "0 auto", padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <Link href="/" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={155} height={100} priority /></Link>
      <nav aria-label="About navigation" style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <Link href="/help">Help Center</Link><Link href="/safety">Safety</Link><Link href="/login">Sign in</Link><Link href="/register" style={{ background: "#3157d5", color: "white", borderRadius: 999, padding: "11px 18px", textDecoration: "none", fontWeight: 700 }}>Register Now</Link>
      </nav>
    </header>
    <section style={{ maxWidth: 1080, margin: "40px auto 0", padding: "36px 24px 70px", textAlign: "center" }}>
      <span style={{ display: "inline-block", color: "#3157d5", fontWeight: 800, letterSpacing: ".14em", fontSize: 12 }}>ABOUT CONNECTTIME</span>
      <h1 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 1.04, letterSpacing: "-.055em", margin: "18px 0", fontWeight: 850 }}>A world of people.<br/><span style={{ color: "#3157d5" }}>A place to connect.</span></h1>
      <p style={{ maxWidth: 730, margin: "0 auto", fontSize: 19, lineHeight: 1.7, color: "#5c6680" }}>ConnectTime is being built to bring social discovery, community, entertainment and meaningful connections together—while putting people and their safety at the center.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 28 }}><Link href="/register" style={{ background: "#3157d5", color: "white", borderRadius: 12, padding: "14px 22px", textDecoration: "none", fontWeight: 750 }}>Register Now ↗</Link><Link href="/help" style={{ border: "1px solid #d7def0", color: "#26365f", borderRadius: 12, padding: "14px 22px", textDecoration: "none", fontWeight: 700 }}>Visit Help Center</Link></div>
    </section>
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px 60px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 18 }}>
      {pillars.map(item => <article key={item.title} style={{ background: "white", border: "1px solid #e8ecf6", borderRadius: 20, padding: 25, boxShadow: "0 12px 35px #263b7510" }}><div style={{ fontSize: 30 }}>{item.icon}</div><h2 style={{ fontSize: 21, margin: "15px 0 8px" }}>{item.title}</h2><p style={{ color: "#68728a", lineHeight: 1.65, margin: 0 }}>{item.text}</p></article>)}
    </section>
    <section style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 24px 75px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}><span style={{ color: "#3157d5", fontWeight: 800, letterSpacing: ".12em", fontSize: 12 }}>EXPLORE CONNECTTIME</span><h2 style={{ fontSize: "clamp(30px,4vw,45px)", letterSpacing: "-.04em", margin: "10px 0" }}>More ways to connect</h2></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>{experiences.map(([icon,title,desc]) => <article key={title} style={{ border: "1px solid #e8ecf6", borderRadius: 16, padding: 20, background: "#fbfcff" }}><span style={{ fontSize: 25 }}>{icon}</span><h3 style={{ margin: "10px 0 6px" }}>{title}</h3><p style={{ margin: 0, color: "#68728a", lineHeight: 1.6 }}>{desc}</p></article>)}</div>
    </section>
    <footer style={{ borderTop: "1px solid #e8ecf6", padding: "24px", textAlign: "center", color: "#68728a" }}>ConnectTime · Built around people, community and connection <span aria-hidden="true">•</span> <Link href="/community-guidelines">Community Guidelines</Link> <span aria-hidden="true">•</span> <Link href="/privacy">Privacy</Link> <span aria-hidden="true">•</span> <Link href="/terms">Terms</Link></footer>
  </main>;
}
