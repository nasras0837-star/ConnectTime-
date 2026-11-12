"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";

type ProfileSummary = {
  handle?: string;
  display_name?: string;
  bio?: string;
  country?: string;
  interests?: string;
};

const spaces = [
  { icon: "♧", title: "Friends", detail: "Your circle, requests and connections", href: "/friends", tone: "mint" },
  { icon: "✉", title: "Messages", detail: "Pick up your conversations", href: "/messages", tone: "blue" },
  { icon: "⌕", title: "Discover", detail: "Meet people and find shared interests", href: "/discover", tone: "violet" },
  { icon: "♡", title: "Match Maker", detail: "Explore dating likes and matches", href: "/dating", tone: "rose" },
  { icon: "◉", title: "Community", detail: "Share ideas and join discussions", href: "/community", tone: "sky" },
  { icon: "▦", title: "Groups", detail: "Find your people around every interest", href: "/groups", tone: "gold" },
  { icon: "🛍", title: "Marketplace", detail: "Explore the community marketplace", href: "/marketplace", tone: "mint" },
  { icon: "🎙", title: "Podcasts", detail: "Discover shows and episodes", href: "/podcasts", tone: "violet" },
  { icon: "📰", title: "News", detail: "Catch up with stories that matter", href: "/news", tone: "blue" },
  { icon: "📺", title: "ConnectTime TV", detail: "Explore video and official channels", href: "/free-tv", tone: "rose" },
  { icon: "🎵", title: "Music & Radio", detail: "Listen across genres and regions", href: "/radio", tone: "gold" },
  { icon: "🎉", title: "Events", detail: "Find activities and gatherings", href: "/events", tone: "sky" },
  { icon: "🔴", title: "Live", detail: "Explore live community experiences", href: "/live", tone: "rose" },
];

export default function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string; country?: string }> }) {
  const [name, setName] = useState("Connect member");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileSummary>({});
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [country, setCountry] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve(searchParams).then(params => {
      if (!active) return;
      setWelcome(params.welcome === "1");
      setCountry(params.country || "");
    });
    fetch("/api/account", { cache: "no-store" })
      .then(async response => {
        if (response.status === 401) throw new Error("signed_out");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load your account.");
        if (!active) return;
        setName(data.user?.name || data.name || "Connect member");
        setEmail(data.user?.email || data.email || "");
      })
      .catch(error => {
        if (active && error instanceof Error && error.message === "signed_out") setSignedOut(true);
      })
      .finally(() => { if (active) setLoading(false); });
    fetch("/api/profile", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(data => { if (active && data?.profile) setProfile(data.profile); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [searchParams]);

  const displayName = profile.display_name || name;
  const initial = (displayName || email || "C").trim().charAt(0).toUpperCase() || "C";
  const profileHref = country ? `/profile?country=${encodeURIComponent(country)}` : "/profile";

  if (signedOut) {
    return <main className="connectMemberDashboard"><ConnectSiteHeader /><section className="connectAccountCard"><h1>Welcome to your Connect space</h1><p>Please log in to view your profile and personal spaces.</p><Link href="/login">Log in to Connect →</Link></section></main>;
  }

  return (
    <main className="connectMemberDashboard connectProfileHome">
      <ConnectSiteHeader />
      <div className="connectProfileLayout">
        <aside className="connectProfileSidebar">
          <div className="connectProfileMini">
            <div className="connectProfileMiniCover" />
            <span className="connectProfileAvatar">{initial}</span>
            <strong>{loading ? "Loading your profile…" : displayName}</strong>
            {profile.handle && <small>@{profile.handle}</small>}
            {profile.country && <small>{profile.country}</small>}
            <Link href={profileHref}>View & edit profile <span>↗</span></Link>
          </div>
          <div className="connectProfileNavLabel">YOUR SPACE</div>
          <nav className="connectProfileNav" aria-label="Your Connect navigation">
            <Link className="active" href="/account"><span>⌂</span> Overview</Link>
            <Link href={profileHref}><span>◎</span> My profile</Link>
            <Link href="/friends"><span>♧</span> Friends</Link>
            <Link href="/messages"><span>✉</span> Messages</Link>
            <Link href="/notifications"><span>♢</span> Notifications</Link>
            <Link href="/account/settings"><span>⚙</span> Settings</Link>
          </nav>
          <div className="connectProfileSidebarFoot">
            <Link href="/safety">Safety Center</Link>
            <Link href="/feedback">Help & feedback</Link>
          </div>
        </aside>

        <section className="connectProfileMain">
          {welcome && <div className="connectDashNotice" role="status">You’re in! Welcome to Connect. Add a few profile details and start exploring.</div>}
          <section className="connectProfileHero">
            <div className="connectProfileHeroGlow" aria-hidden="true" />
            <div className="connectProfileHeroContent">
              <span className="connectProfileEyebrow">YOUR CONNECT WORLD</span>
              <div className="connectProfileHeroIdentity">
                <span className="connectProfileHeroAvatar">{initial}</span>
                <div>
                  <h1>{loading ? "Welcome to Connect" : `Welcome back, ${displayName.split(" ")[0]}!`}</h1>
                  <p>{profile.bio || "Your people, your passions, your space. Make it yours."}</p>
                  {profile.handle && <small>@{profile.handle}</small>}
                </div>
              </div>
              <div className="connectProfileHeroActions">
                <Link href={profileHref} className="connectProfilePrimary">Personalize your profile <span>→</span></Link>
                <Link href="/community" className="connectProfileSecondary">Explore community</Link>
              </div>
            </div>
            <div className="connectProfileHeroArt" aria-hidden="true"><span>✦</span><b>Connect<br/>with your world</b><i>✧</i></div>
          </section>

          <div className="connectProfileWelcomeRow">
            <div><span className="connectProfileEyebrow">MADE FOR YOU</span><h2>Everything you love, all in one place.</h2><p>Jump into a space, find your people and keep the good conversations going.</p></div>
            <Link href="/discover">Find something new ↗</Link>
          </div>

          <section className="connectProfileQuickGrid" aria-label="Quick actions">
            <Link href="/community" className="connectProfileQuick"><span className="mint">✎</span><div><strong>Share something</strong><small>Start a community post</small></div><b>→</b></Link>
            <Link href="/discover" className="connectProfileQuick"><span className="blue">⌕</span><div><strong>Meet people</strong><small>Discover new connections</small></div><b>→</b></Link>
            <Link href="/messages" className="connectProfileQuick"><span className="violet">✉</span><div><strong>Say hello</strong><small>Open your messages</small></div><b>→</b></Link>
          </section>

          <div className="connectProfileSectionHead"><div><span className="connectProfileEyebrow">EXPLORE YOUR CONNECT</span><h2>Your spaces</h2><p>All your favorite Connect features, right at your fingertips.</p></div><span className="connectProfileFeatureCount">13 spaces to explore</span></div>
          <section className="connectProfileSpaces">
            {spaces.map(space => (
              <Link href={space.href} key={space.title} className="connectProfileSpace">
                <span className={`connectProfileSpaceIcon ${space.tone}`}>{space.icon}</span>
                <span className="connectProfileSpaceCopy"><strong>{space.title}</strong><small>{space.detail}</small></span>
                <span className="connectProfileSpaceArrow">↗</span>
              </Link>
            ))}
          </section>

          <section className="connectProfileBottom">
            <div><span className="connectProfileEyebrow">A SPACE THAT FEELS LIKE YOU</span><h2>Make your profile shine.</h2><p>Add a photo, share your interests and let the community get to know you.</p></div>
            <Link href={profileHref}>Edit my profile →</Link>
          </section>
          <footer className="connectProfileFooter"><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/community-guidelines">Community guidelines</Link><span>© {new Date().getFullYear()} Techcyber LLC</span></footer>
        </section>
      </div>
    </main>
  );
}
