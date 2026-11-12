import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { checkMemberAccess } from "@/lib/member-access";
import { SignOutButton } from "./signout-button";
import styles from "./dashboard-refresh.module.css";

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

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string; country?: string }> }) {
  const params = await searchParams;
  const profileHref = params.country ? `/profile?country=${encodeURIComponent(params.country)}` : "/profile";
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) return <main className="connectAccountShell"><ConnectSiteHeader /><section className="connectAccountCard"><h1>Connect setup required</h1><p>Appwrite environment settings have not been configured yet.</p><Link href="/">Return home</Link></section></main>;
  const user = await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID }).getLoggedInUser();
  if (!user) redirect("/login");
  const decision = await checkMemberAccess();
  const status = decision.allowed ? "Active · Verified adult" : decision.reason === "not_eligible" ? "Pending · Verification or activation required" : decision.reason === "not_configured" ? "Setup required · Access settings are not configured" : decision.reason === "access_unavailable" ? "Temporarily unavailable · Access could not be confirmed" : "Signed in";
  const displayName = user.name || "Connect member";
  const initial = (displayName || user.email || "C").trim().charAt(0).toUpperCase() || "C";

  return (
    <main className={`${styles.dashboardRefresh} connectMemberDashboard connectProfileHome`}>
      <ConnectSiteHeader />
      <div className="connectProfileLayout">
        <aside className="connectProfileSidebar">
          <div className="connectProfileMini">
            <div className="connectProfileMiniCover" />
            <span className="connectProfileAvatar">{initial}</span>
            <strong>{displayName}</strong>
            <small>{user.email || "Your Connect account"}</small>
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
            <SignOutButton />
          </div>
        </aside>

        <section className="connectProfileMain">
          {params.welcome === "1" && <div className="connectDashNotice" role="status">You’re in! Welcome to Connect. Add a few profile details and start exploring.</div>}
          <section className="connectProfileHero">
            <div className="connectProfileHeroGlow" aria-hidden="true" />
            <div className="connectProfileHeroContent">
              <span className="connectProfileEyebrow">YOUR CONNECT WORLD</span>
              <div className="connectProfileHeroIdentity">
                <span className="connectProfileHeroAvatar">{initial}</span>
                <div>
                  <h1>Welcome back, {displayName.split(" ")[0]}!</h1>
                  <p>Your people, your passions, your space. Make it yours.</p>
                  <small>{user.email || "Your personal Connect space"}</small>
                </div>
              </div>
              <div className="connectProfileHeroActions">
                <Link href={profileHref} className="connectProfilePrimary">Personalize your profile <span>→</span></Link>
                <Link href="/community" className="connectProfileSecondary">Explore community</Link>
              </div>
            </div>
            <div className="connectProfileHeroArt" aria-hidden="true"><span>✦</span><b>Connect<br/>with your world</b><i>✧</i></div>
          </section>

          <div className="connectProfileStatus">
            <span className={decision.allowed ? "connectStatusDot good" : "connectStatusDot"} />
            <div><strong>{status}</strong><p>{decision.allowed ? "Your member access is active. Individual features continue to apply their own safety checks." : decision.reason === "not_eligible" ? "Some member features remain locked until verification and activation are complete." : "Protected member features remain unavailable until access can be confirmed."}</p></div>
            {!decision.allowed && <Link href="/verification">Review verification →</Link>}
          </div>

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
