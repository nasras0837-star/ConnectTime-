import Link from "next/link";
import { ConnectSiteHeader } from "@/app/components/connect-site-header";
import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { checkMemberAccess } from "@/lib/member-access";
import { SignOutButton } from "./signout-button";

const dashboardItems = [
  { icon: "♧", title: "Friends", detail: "Grow your circle and manage requests.", href: "/friends", tone: "mint" },
  { icon: "✉", title: "Messages", detail: "Continue private conversations.", href: "/messages", tone: "blue" },
  { icon: "⌕", title: "Discover", detail: "Find people and shared interests.", href: "/discover", tone: "violet" },
  { icon: "♡", title: "Dating", detail: "Explore adult dating connections.", href: "/dating", tone: "rose" },
  { icon: "♧", title: "Groups", detail: "Join communities around your interests.", href: "/groups", tone: "gold" },
  { icon: "◉", title: "Community", detail: "Share ideas and join discussions.", href: "/community", tone: "sky" },
];

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string; country?: string }> }) {
  const params = await searchParams;
  const profileHref = params.country ? `/profile?country=${encodeURIComponent(params.country)}` : "/profile";
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) return <main className="connectAccountShell"><ConnectSiteHeader /><section className="connectAccountCard"><h1>Connect setup required</h1><p>Appwrite environment settings have not been configured yet.</p><Link href="/">Return home</Link></section></main>;
  const user = await createNextServerHelpers({ endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT, projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID }).getLoggedInUser();
  if (!user) redirect("/login");
  const decision = await checkMemberAccess();
  const status = decision.allowed ? "Active · Verified adult" : decision.reason === "not_eligible" ? "Pending · Verification or activation required" : decision.reason === "not_configured" ? "Setup required · Access settings are not configured" : decision.reason === "access_unavailable" ? "Temporarily unavailable · Access could not be confirmed" : "Signed in";
  return <main className="connectMemberDashboard">
    <ConnectSiteHeader />
    <div className="connectDashboardLayout">
      <aside className="connectDashboardSide">
        <div className="connectDashboardIdentity"><span className="connectDashboardAvatar">{(user.name || user.email || "C").slice(0,1).toUpperCase()}</span><div><strong>{user.name || "Connect member"}</strong><small>{user.email || "Your Connect account"}</small></div></div>
        <div className="connectDashboardNavLabel">YOUR SPACE</div>
        <Link className="connectDashNav active" href="/account">▦ <span>Overview</span></Link>
        <Link className="connectDashNav" href="/profile">◎ <span>My profile</span></Link>
        <Link className="connectDashNav" href="/friends">♧ <span>Friends</span></Link>
        <Link className="connectDashNav" href="/messages">✉ <span>Messages</span></Link>
        <Link className="connectDashNav" href="/notifications">♢ <span>Notifications</span></Link>
        <Link className="connectDashNav" href="/account/settings">⚙ <span>Settings</span></Link>
        <div className="connectDashboardSideFoot"><Link href="/safety">Safety Center</Link><Link href="/feedback">Help & feedback</Link><SignOutButton /></div>
      </aside>
      <section className="connectDashboardMain">
        <div className="connectDashboardGreeting"><div><span className="connectDashEyebrow">MEMBER HOME</span><h1>Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1><p>Your people, conversations and communities—one place to connect.</p></div><Link className="connectDashboardProfileButton" href={profileHref}>Edit profile ↗</Link></div>
        {params.welcome === "1" && <>
          <div className="connectDashNotice" role="status">Welcome to Connect! Your account is ready. Here are three easy ways to get started.</div>
          <section className="connectWelcomeJourney" aria-label="Your first steps on Connect">
            <div className="connectWelcomeJourneyHead"><div><span>YOUR FIRST FEW MINUTES</span><h2>Make yourself at home</h2><p>Take these steps at your own pace. You can come back to them anytime.</p></div><span className="connectWelcomeJourneySpark" aria-hidden="true">✦</span></div>
            <div className="connectWelcomeJourneyGrid">
              <Link href={profileHref}><span className="connectJourneyNumber">01</span><span className="connectJourneyIcon">◎</span><strong>Introduce yourself</strong><small>Add a photo when available, a short bio and the interests you love.</small><b>Set up your profile →</b></Link>
              <Link href="/discover"><span className="connectJourneyNumber">02</span><span className="connectJourneyIcon">⌕</span><strong>Find your people</strong><small>Discover members and send a friendly connection request.</small><b>Explore members →</b></Link>
              <Link href="/community"><span className="connectJourneyNumber">03</span><span className="connectJourneyIcon">◉</span><strong>Join the conversation</strong><small>Read community updates or share your first text post.</small><b>Visit the community →</b></Link>
            </div>
          </section>
        </>}
        <div className="connectDashboardStatus"><span className={decision.allowed ? "connectStatusDot good" : "connectStatusDot"} /> <div><strong>{status}</strong><p>{decision.allowed ? "Your member access is active. Individual features continue to apply their own safety checks." : decision.reason === "not_eligible" ? "Some member features remain locked until verification and activation are complete." : "Protected member features remain unavailable until access can be confirmed."}</p></div>{!decision.allowed && <Link href="/verification">Review verification →</Link>}</div>
        <div className="connectDashboardSectionHead"><div><span>QUICK ACCESS</span><h2>Your Connect spaces</h2></div><Link href="/discover">Explore all →</Link></div>
        <div className="connectDashboardTiles">{dashboardItems.map(item => <Link href={item.href} key={item.title} className="connectDashboardTile"><span className={`connectDashTileIcon ${item.tone}`}>{item.icon}</span><strong>{item.title}</strong><p>{item.detail}</p><span className="connectDashTileArrow">Open space →</span></Link>)}</div>
        <div className="connectDashboardSectionHead"><div><span>GET STARTED</span><h2>Make Connect yours</h2></div></div>
        <div className="connectDashboardNextSteps"><Link href={profileHref}><span>01</span><div><strong>Build your profile</strong><p>Add your interests and introduce yourself.</p></div><b>→</b></Link><Link href="/discover"><span>02</span><div><strong>Find your people</strong><p>Discover members with common interests.</p></div><b>→</b></Link><Link href="/community"><span>03</span><div><strong>Join the conversation</strong><p>Explore discussions and community spaces.</p></div><b>→</b></Link></div>
        <div className="connectDashboardExplore"><div><span>BEYOND YOUR NETWORK</span><h2>Explore more of Connect</h2><p>News, podcasts, video, music and regional updates.</p></div><div className="connectDashboardExploreLinks"><Link href="/news">News ↗</Link><Link href="/podcasts">Podcasts ↗</Link><Link href="/free-tv">TV & video ↗</Link><Link href="/radio">Music & radio ↗</Link></div></div>
      </section>
    </div>
  </main>;
}
