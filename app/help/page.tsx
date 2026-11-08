"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const topics = [
  {
    id: "account",
    icon: "👤",
    title: "Accounts and registration",
    summary: "Create an account, sign in, or recover access.",
    questions: [
      { q: "How do I create a ConnectTime account?", a: "Choose Register Now, complete the registration form, confirm that you are at least 18, and accept the applicable terms and community guidelines. Some member experiences remain locked until account and eligibility checks are completed.", links: [{ label: "Register Now", href: "/register" }] },
      { q: "I cannot sign in. What should I do?", a: "Check that you are using the email address associated with your account. If sign-in still fails, use Forgot password on the login page. If the service reports that setup is incomplete, the platform administrator must finish the required authentication configuration.", links: [{ label: "Sign in", href: "/login" }] },
      { q: "How do I reset my password?", a: "Open the sign-in page and choose Forgot password. Follow the instructions sent to your email. Use a unique password and never share a recovery link or password with anyone.", links: [{ label: "Open sign in", href: "/login" }] },
    ],
  },
  {
    id: "verification",
    icon: "🛡️",
    title: "Age checks and member access",
    summary: "Understand why some member features are restricted.",
    questions: [
      { q: "Why are some features unavailable after I sign in?", a: "Signing in does not by itself establish verified-adult status or active member access. Protected experiences remain unavailable until the required independent verification and server-side account activation have been confirmed.", links: [{ label: "Account page", href: "/account" }, { label: "Safety Center", href: "/safety" }] },
      { q: "Can I use ConnectTime if I am under 18?", a: "No. ConnectTime is intended for adults aged 18 and older. Do not attempt to bypass age or identity checks or use another person's identity." },
    ],
  },
  {
    id: "media",
    icon: "📺",
    title: "Free TV, Radio and Video Tube",
    summary: "Find official broadcasters, radio stations and media.",
    questions: [
      { q: "Is Free TV hosted by ConnectTime?", a: "No. The directory links to official broadcaster websites and services. Availability, account requirements, regional restrictions, schedules and playback are controlled by each broadcaster.", links: [{ label: "Browse Free TV", href: "/free-tv" }] },
      { q: "Why does a TV channel or radio station not play?", a: "The broadcaster may have changed its stream, restricted access by region, or temporarily taken the service offline. Try the broadcaster's official website or choose another station. ConnectTime cannot bypass regional restrictions.", links: [{ label: "Free TV", href: "/free-tv" }, { label: "Free Radio", href: "/radio" }] },
      { q: "Can I save favorite radio stations?", a: "The Radio page lets you save stations in the browser on the device you are using. Clearing browser storage or switching devices may remove those local favorites.", links: [{ label: "Open Radio", href: "/radio" }] },
      { q: "Does ConnectTime own the videos or broadcasts?", a: "ConnectTime provides discovery and links to third-party media destinations. Rights, licensing, content and availability remain with the respective publishers, creators and broadcasters.", links: [{ label: "Video Tube", href: "/videos" }] },
    ],
  },
  {
    id: "community",
    icon: "💬",
    title: "Community and connections",
    summary: "Learn about member interactions and community tools.",
    questions: [
      { q: "How do I report a safety concern?", a: "Open the Safety Center and submit the report form with the relevant category and context. Do not include passwords, payment details or unnecessary sensitive information. If someone is in immediate danger, contact local emergency services.", links: [{ label: "Open Safety Center", href: "/safety" }] },
      { q: "How do blocking and appeals work?", a: "The Safety Center provides forms to manage blocks and submit appeals. Some tools depend on server-side configuration, and a submission is not a guarantee that a moderation decision will be reversed.", links: [{ label: "Safety Center", href: "/safety" }, { label: "Community Guidelines", href: "/community-guidelines" }] },
      { q: "Where can I share an idea or report a website problem?", a: "Use the feedback page to rate your experience and describe an issue or improvement idea. Feedback submission requires sign-in and an available feedback service.", links: [{ label: "Send feedback", href: "/feedback" }] },
    ],
  },
  {
    id: "privacy",
    icon: "🔐",
    title: "Privacy and policies",
    summary: "Review the rules that govern your use of ConnectTime.",
    questions: [
      { q: "Where can I read the privacy and service terms?", a: "The current website policy pages explain the applicable terms and privacy information. Review them before creating an account or using member features.", links: [{ label: "Privacy policy", href: "/legal/privacy" }, { label: "Terms of service", href: "/legal/terms" }] },
      { q: "What should I include in a support or feedback request?", a: "Describe the page, action and error message, and include the approximate time it happened. Never send your password, recovery code, full payment-card number, government ID number or other sensitive credentials." },
    ],
  },
];

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return topics;
    return topics.map(topic => ({
      ...topic,
      questions: topic.questions.filter(item => (topic.title + " " + topic.summary + " " + item.q + " " + item.a).toLowerCase().includes(term)),
    })).filter(topic => topic.questions.length > 0);
  }, [query]);

  return <main className="authShell">
    <Link className="logo ctAuthLogo" href="/" aria-label="ConnectTime home"><img src="/connecttime-logo.svg" alt="ConnectTime" width={180} height={117} className="ctLogoImage" /></Link>
    <div style={{ width: "min(100%, 900px)", padding: "0 14px 48px" }}>
      <header className="authCard">
        <div className="eyebrow">CONNECTTIME · HELP & SUPPORT</div>
        <h1>How can we help?</h1>
        <p>Find answers about your account, member access, media features, community safety and privacy.</p>
        <label style={{ display: "grid", gap: 8, marginTop: 22, fontWeight: 700 }}>
          Search help topics
          <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Try “password”, “radio” or “verification”" aria-label="Search help topics" style={{ width: "100%", padding: "14px 15px", border: "1px solid #d9dbe7", borderRadius: 10, font: "inherit", background: "white" }} />
        </label>
        <p style={{ fontSize: 12, color: "#777", marginBottom: 0 }} aria-live="polite">{filtered.reduce((count, topic) => count + topic.questions.length, 0)} help articles found</p>
      </header>

      {filtered.length === 0 ? <section className="authCard" style={{ marginTop: 18 }}><h2>No matching answers</h2><p>Try a different search term or send us feedback about the help topic you need.</p><Link href="/feedback">Share feedback →</Link></section> : filtered.map(topic => <section key={topic.id} className="authCard" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span aria-hidden="true" style={{ fontSize: 28 }}>{topic.icon}</span>
          <div><h2 style={{ margin: 0, fontSize: 22, letterSpacing: "-.5px" }}>{topic.title}</h2><p style={{ margin: "5px 0 0", fontSize: 13 }}>{topic.summary}</p></div>
        </div>
        <div style={{ marginTop: 18 }}>
          {topic.questions.map((item, index) => {
            const key = topic.id + "-" + index;
            const expanded = open === key;
            return <article key={key} style={{ borderTop: "1px solid #e9eaf1", padding: "14px 0" }}>
              <h3 style={{ margin: 0, fontSize: 16, letterSpacing: "-.2px" }}>
                <button type="button" aria-expanded={expanded} aria-controls={"answer-" + key} onClick={() => setOpen(expanded ? null : key)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", border: 0, padding: 0, background: "transparent", color: "inherit", textAlign: "left", font: "inherit", fontWeight: 700, cursor: "pointer" }}>
                  {item.q}<span aria-hidden="true">{expanded ? "−" : "+"}</span>
                </button>
              </h3>
              {expanded && <div id={"answer-" + key} style={{ paddingTop: 12, color: "#62677c", fontSize: 14, lineHeight: 1.7 }}>
                <p style={{ marginTop: 0 }}>{item.a}</p>
                {item.links && <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>{item.links.map(link => <Link key={link.href} href={link.href} style={{ color: "#6958d2", fontWeight: 700 }}>{link.label} →</Link>)}</div>}
              </div>}
            </article>;
          })}
        </div>
      </section>)}

      <section className="authCard" style={{ marginTop: 18 }}>
        <div className="eyebrow">STILL NEED HELP?</div>
        <h2>Tell us what is not working.</h2>
        <p>Share the page you were using and what happened. Please do not include passwords, recovery codes, payment information or identity-document details.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="/feedback" className="button">Send feedback</Link>
          <Link href="/safety" className="button" style={{ background: "#eeeaf9", color: "#51419b" }}>Safety Center</Link>
        </div>
      </section>
      <p className="switch"><Link href="/">← Back to ConnectTime</Link></p>
    </div>
  </main>;
}
