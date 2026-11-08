import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { checkMemberAccess } from "@/lib/member-access";
import { SignOutButton } from "./signout-button";

type DashboardLink = {
  icon: string;
  title: string;
  description: string;
  href: string;
  label: string;
};

const memberLinks: DashboardLink[] = [
  { icon: "🌐", title: "Discover members", description: "Find people by shared interests and location.", href: "/discover", label: "Discover people" },
  { icon: "🤝", title: "Friends & requests", description: "Manage invitations and keep your circle growing.", href: "/friends", label: "Open friends" },
  { icon: "💬", title: "Private messages", description: "Continue conversations with your connections.", href: "/messages", label: "Open messages" },
  { icon: "📰", title: "Community feed", description: "Share updates and join thoughtful discussions.", href: "/community", label: "Visit community" },
  { icon: "👥", title: "Groups", description: "Find interest-led communities or start your own.", href: "/groups", label: "Explore groups" },
  { icon: "🔔", title: "Notifications", description: "See updates about your ConnectTime activity.", href: "/notifications", label: "View notifications" },
  { icon: "💜", title: "Dating & Match Maker", description: "Explore adult dating after required identity and age checks.", href: "/dating", label: "Explore dating" },
  { icon: "🎬", title: "ConnectTime Video Tube", description: "Discover videos, creators, learning and entertainment.", href: "/videos", label: "Watch Video Tube" },
  { icon: "📺", title: "Free TV directory", description: "Explore official broadcaster destinations by region.", href: "/free-tv", label: "Explore TV" },
  { icon: "🎵", title: "Music & radio", description: "Find radio stations and music from around the world.", href: "/radio", label: "Listen now" },
  { icon: "📅", title: "Events", description: "Discover community events and submit ideas for review.", href: "/events", label: "Explore events" },
  { icon: "🎥", title: "Group meetings", description: "Create private video meeting rooms for your circle.", href: "/meetings", label: "Open meetings" },
];

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
    return <main className="ctAccountPage"><section className="ctAccountPanel"><h1>ConnectTime setup required</h1><p>Appwrite environment settings have not been configured yet.</p><Link href="/">Return home</Link></section></main>;
  }

  const user = await createNextServerHelpers({
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  }).getLoggedInUser();

  if (!user) redirect("/login");

  const decision = await checkMemberAccess();
  const status = decision.allowed
    ? "Active · Verified adult"
    : decision.reason === "not_eligible"
      ? "Pending · Verification or activation required"
      : decision.reason === "not_configured"
        ? "Setup required · Access settings are not configured"
        : decision.reason === "access_unavailable"
          ? "Temporarily unavailable · Access could not be confirmed"
          : "Signed in";

  const explanation = decision.allowed
    ? "Your server-side member record authorizes access. Individual features still apply their own privacy, connection and safety rules."
    : decision.reason === "not_eligible"
      ? "Your sign-in is ready. Member features remain locked until independent adult verification and server-side account activation are complete."
      : decision.reason === "not_configured"
        ? "Your sign-in is working, but the member-access service still needs configuration. Protected features remain locked until setup is complete."
        : "We could not confirm your member-access status right now. Protected features remain locked; please try again later.";

  return (
    <main className="ctAccountPage">
      <header className="ctAccountHeader">
        <Link href="/" className="ctAccountBrand" aria-label="ConnectTime home">
          <Image src="/connecttime-logo.svg" alt="" width={48} height={48} priority />
          <span>Connect<span>Time</span><small>Your people. Your passions. Your ConnectTime.</small></span>
        </Link>
        <nav aria-label="Account navigation">
          <Link href="/">Home</Link>
          <Link href="/profile">Edit profile</Link>
          <Link href="/safety">Safety center</Link>
        </nav>
      </header>

      <section className="ctAccountWelcome">
        <div>
          <span className="ctAccountEyebrow">YOUR CONNECTTIME SPACE</span>
          <h1>Welcome{user.name ? `, ${user.name.split(" ")[0]}` : " back"}.</h1>
          <p>One place to manage your profile, connections, conversations and the things you love.</p>
        </div>
        <div className="ctAccountMember">
          <span className="ctAccountAvatar">{(user.name || user.email || "C").slice(0, 1).toUpperCase()}</span>
          <div><strong>{user.name || "ConnectTime member"}</strong><small>{user.email || "Signed-in account"}</small></div>
        </div>
      </section>

      <section className={decision.allowed ? "ctAccountStatus isActive" : "ctAccountStatus"} role="status" aria-live="polite">
        <span className="ctAccountStatusIcon">{decision.allowed ? "✓" : "🔒"}</span>
        <div><span className="ctAccountEyebrow">ACCOUNT ACCESS</span><h2>{status}</h2><p>{explanation}</p></div>
        {!decision.allowed && <Link href="/safety">Review verification requirements ↗</Link>}
      </section>

      <section className="ctAccountQuick">
        <Link href="/profile"><span>👤</span><div><strong>Your profile</strong><small>Update your details and interests</small></div><b>→</b></Link>
        <Link href="/safety"><span>🛡️</span><div><strong>Safety & blocking</strong><small>Manage blocks and report community concerns</small></div><b>→</b></Link>
        <Link href="/feedback"><span>💡</span><div><strong>Share feedback</strong><small>Help shape ConnectTime</small></div><b>→</b></Link>
      </section>

      {decision.allowed ? (
        <section className="ctAccountFeatures">
          <div className="ctAccountSectionHead"><div><span className="ctAccountEyebrow">YOUR PLATFORM</span><h2>Explore ConnectTime</h2><p>Pick up where you left off or discover something new.</p></div><Link href="/">View homepage ↗</Link></div>
          <div className="ctAccountGrid">
            {memberLinks.map(item => <Link className="ctAccountCard" href={item.href} key={item.title}>
              <span className="ctAccountCardIcon">{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p><b>{item.label} <span>→</span></b>
            </Link>)}
          </div>
        </section>
      ) : (
        <section className="ctAccountLocked">
          <div className="ctAccountLockedIcon">🛡️</div>
          <div><span className="ctAccountEyebrow">YOUR NEXT STEP</span><h2>Prepare your member profile</h2><p>You can update your profile and review the safety requirements now. Discover, messaging, groups and other protected member experiences stay unavailable until eligibility and activation are confirmed.</p><div><Link href="/profile">Complete your profile</Link><Link href="/safety">Read safety information</Link></div></div>
        </section>
      )}

      <footer className="ctAccountFooter"><span>© {new Date().getFullYear()} Techcyber LLC · ConnectTime</span><div><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/community-guidelines">Community guidelines</Link></div><SignOutButton /></footer>
    </main>
  );
}
