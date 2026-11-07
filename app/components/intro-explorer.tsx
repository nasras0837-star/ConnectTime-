"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const experiences = [
  { icon: "💖", title: "Match Maker & dating", description: "Adults 18+ only · government ID age and identity checks required.", group: "Connect", color: "showcasePink", detail: "Dating is adults-only. Members must pass government-ID date-of-birth validation and identity/liveness checks with a trusted provider before dating discovery or messaging is unlocked.", href: "/dating" },
  { icon: "🛍️", title: "Marketplace", description: "Discover local finds, independent sellers, and new products.", group: "Discover", color: "showcaseGold", detail: "Explore a marketplace concept for local and international listings, seller discovery, and future buyer and seller tools." },
  { icon: "✍️", title: "Forums, posts & blogs", description: "Share your voice, ask questions, and exchange ideas.", group: "Create", color: "showcaseBlue", detail: "Create posts and longer stories, comment, and take part in interest-based forums and community discussions." },
  { icon: "▶️", title: "ConnectTime Video Tube & media", description: "Discover videos, creators, channels, and shows.", group: "Watch", color: "showcaseCoral", detail: "Explore creator-led entertainment, video channels, and media from around the world.", href: "/videos" },
  { icon: "💬", title: "Friends & messaging", description: "Meet people, grow friendships, and keep the conversation going.", group: "Connect", color: "showcasePink", detail: "Build your circle with profiles, friend connections, text chat, and calls after connecting." },
  { icon: "🌍", title: "Groups & communities", description: "Find your people, wherever they are in the world.", group: "Connect", color: "showcaseViolet", detail: "Join interest-led spaces, discover pages, and take part in community conversations." },
  { icon: "📅", title: "Events", description: "Find local happenings or promote your own event.", group: "Discover", color: "showcaseCoral", detail: "Discover meetups, concerts, workshops, festivals, and community gatherings in your city or around the world. Event promotion is being prepared for launch.", href: "/events" },
  { icon: "📰", title: "News & stories", description: "Keep up with topics, ideas, and stories that matter.", group: "Discover", color: "showcaseMint", detail: "A place for news and community perspectives across interests and regions." },
  { icon: "🔴", title: "Live experiences", description: "Imagine sharing moments with a live audience.", group: "Watch", color: "showcasePink", detail: "Live streaming is part of the planned ConnectTime experience and is still being built." },
  { icon: "📸", title: "Photo & video posts", description: "Share pictures, videos, and everyday moments with the world.", group: "Create", color: "showcaseCoral", detail: "Create photo and video posts with captions. Public uploads will require server-side moderation before launch.", href: "/create" },
  { icon: "🎨", title: "Creator channels", description: "Build an audience around what you love making.", group: "Create", color: "showcaseViolet", detail: "Creator channels and subscriptions are planned experiences, subject to platform readiness." },
  { icon: "📞", title: "Voice & video calls", description: "Make it feel more personal with a conversation.", group: "Connect", color: "showcaseMint", detail: "Voice and video calling are planned for accepted connections and are not yet enabled." },
];

const filters = ["All", "Connect", "Discover", "Watch", "Create"];

export function IntroExplorer() {
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(experiences[0].title);
  const visible = useMemo(() => filter === "All" ? experiences : experiences.filter((item) => item.group === filter), [filter]);
  const active = experiences.find((item) => item.title === selected) ?? visible[0];

  function chooseFilter(value: string) {
    setFilter(value);
    const first = value === "All" ? experiences[0] : experiences.find((item) => item.group === value);
    if (first) setSelected(first.title);
  }

  function surpriseMe() {
    const item = experiences[Math.floor(Math.random() * experiences.length)];
    setFilter("All");
    setSelected(item.title);
  }

  return (
    <section className="featureShowcase interactiveShowcase" aria-labelledby="feature-showcase-title">
      <div className="featureShowcaseHead">
        <div>
          <span>YOUR CONNECTIONS CAN REACH AROUND THE WORLD.</span>
          <h2 id="feature-showcase-title">What are you in the mood for?</h2>
          <p>Explore your interests and meet people who share them—from your neighborhood to the other side of the world.</p>
        </div>
        <button className="surpriseButton" type="button" onClick={surpriseMe}>✨ Surprise me</button>
      </div>
      <div className="experienceFilters" role="group" aria-label="Filter ConnectTime experiences">
        {filters.map((item) => (
          <button key={item} type="button" className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => chooseFilter(item)}>
            {item === "All" ? "🌈" : item === "Connect" ? "🤝" : item === "Discover" ? "🧭" : item === "Watch" ? "🎬" : "🎨"} {item}
          </button>
        ))}
      </div>
      <div className="featureShowcaseGrid interactiveFeatureGrid">
        {visible.map((item) => (
          <button key={item.title} type="button" className={`showcaseCard ${item.color} ${selected === item.title ? "isSelected" : ""}`} onClick={() => setSelected(item.title)} aria-pressed={selected === item.title}>
            <span>{item.icon}</span><div><b>{item.title}</b><small>{item.description}</small></div><i aria-hidden="true">↗</i>
          </button>
        ))}
      </div>
      <div className="experienceDetail" aria-live="polite">
        <div className="detailIcon">{active.icon}</div>
        <div><span>YOUR NEXT DISCOVERY</span><b>{active.title}</b><p>{active.detail}</p></div>
        <Link href={active.href ?? "/signup"}>{active.href === "/videos" ? "Explore Video Tube" : active.href === "/dating" ? "Review Dating verification" : "Join the community"} ↗</Link>
      </div>
      <p className="showcaseNote">ConnectTime is being built in stages. Some experiences shown here are previews and are not yet available. Membership is for adults 18+.</p>
    </section>
  );
}
