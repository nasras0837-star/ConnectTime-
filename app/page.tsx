import Link from "next/link";
import LiveInterestFeed from "./components/live-interest-feed";
import LiveNewsArticles from "./components/live-news-articles";
import SportsScores from "./components/sports-scores";
import MarketSnapshot from "./components/market-snapshot";
import RegionalWeather from "./components/regional-weather";
import { MemberCount } from "./components/member-count";
import { LanguageSwitcher } from "./components/language-switcher";

const primaryLinks = [
  { icon: "⌂", label: "Home", href: "/" },
  { icon: "◉", label: "Community", href: "/community" },
  { icon: "⌕", label: "Discover people", href: "/discover" },
  { icon: "♧", label: "Friends", href: "/friends" },
  { icon: "✉", label: "Messages", href: "/messages" },
  { icon: "▦", label: "Groups", href: "/groups" },
  { icon: "♡", label: "Dating", href: "/dating" },
];
const exploreLinks = [
  { icon: "🛍️", title: "Marketplace", detail: "Buy and sell with the community", href: "/marketplace", tone: "mint" },
  { icon: "🎉", title: "Events", detail: "Find activities and gatherings", href: "/events", tone: "gold" },
  { icon: "📰", title: "News", detail: "Follow stories from around the world", href: "/news", tone: "blue" },
  { icon: "📺", title: "Video & TV", detail: "Explore official channels and video", href: "/free-tv", tone: "violet" },
  { icon: "🎵", title: "Music & Radio", detail: "Listen across countries and cultures", href: "/radio", tone: "rose" },
  { icon: "🎥", title: "Group meetings", detail: "Meet face-to-face online", href: "/meetings", tone: "sky" },
];

export default function HomePage() {
  return (
    <main className="connectSocialHome">
      <header className="connectTopbar">
        <Link href="/" className="connectBrand" aria-label="Connect home">
          <img className="connectBrandLogo" src="/connect-logo.svg" alt="Connect" />
        </Link>
        <Link href="/discover" className="connectSearch" aria-label="Search people and interests">
          <span aria-hidden="true">⌕</span><span>Search people, groups and interests</span>
        </Link>
        <nav className="connectTopLinks" aria-label="Quick navigation">
          <Link href="/community">Community</Link>
          <Link href="/discover">Discover</Link>
          <Link href="/messages">Messages</Link>
          <Link href="/news">News</Link>
        </nav>
        <div className="connectTopActions">
          <Link href="/login" className="connectLogin">Log in</Link>
          <Link href="/register" className="connectJoin">Join Connect</Link>
        </div>
      </header>

      <div className="connectSocialGrid">
        <aside className="connectLeftRail" aria-label="Main sections">
          <section className="connectRailCard">
            <div className="connectRailLabel">YOUR CONNECT</div>
            <nav className="connectRailNav">
              {primaryLinks.map(item => (
                <Link href={item.href} key={item.label} className={item.href === "/" ? "active" : ""}>
                  <span aria-hidden="true">{item.icon}</span>{item.label}
                </Link>
              ))}
            </nav>
            <div className="connectRailDivider" />
            <div className="connectRailLabel">EXPLORE</div>
            <nav className="connectRailNav">
              <Link href="/marketplace"><span>▣</span>Marketplace</Link>
              <Link href="/events"><span>✦</span>Events</Link>
              <Link href="/free-tv"><span>▷</span>Video & TV</Link>
              <Link href="/radio"><span>♫</span>Music & Radio</Link>
              <Link href="/advertise"><span>↗</span>Advertise</Link>
            </nav>
          </section>
          <section className="connectRailSafety">
            <span aria-hidden="true">✓</span>
            <div><strong>Community comes first</strong><p>Explore respectfully. Adults 18+; safety rules apply across Connect.</p>
              <Link href="/safety">Visit Safety Center →</Link>
            </div>
          </section>
          <footer className="connectRailFooter">
            <Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/feedback">Feedback</Link>
            <span>© {new Date().getFullYear()} Techcyber LLC</span>
          </footer>
        </aside>

        <section className="connectMainColumn">
          <section className="connectWelcome">
            <div className="connectWelcomeImage" aria-hidden="true" />
            <div className="connectWelcomeShade" aria-hidden="true" />
            <div className="connectWelcomeCopy">
              <span className="connectWelcomeEyebrow">YOUR GLOBAL SOCIAL NETWORK</span>
              <h1>Your people.<br /><em>Your world.</em></h1>
              <p>Meet people, build communities, share ideas and discover the media that matters to you — all in one place.</p>
              <div className="connectWelcomeActions">
                <Link href="/register" className="connectWelcomePrimary">Create your account <span>→</span></Link>
                <Link href="/community" className="connectWelcomeSecondary">Explore the community</Link>
              </div>
              <div className="connectWelcomeProof"><span>🌍 Global perspectives</span><span>💬 Private messaging</span><span>🛡️ Safety-focused</span></div>
            </div>
          </section>

          <section className="connectComposerPrompt">
            <div className="connectPromptAvatar" aria-hidden="true">C</div>
            <div className="connectPromptContent">
              <strong>What&apos;s happening in your world?</strong>
              <p>Share a thought, join a discussion or meet someone new.</p>
              <div className="connectPromptActions">
                <Link href="/community"><span>✎</span> Start a discussion</Link>
                <Link href="/discover"><span>⌕</span> Find people</Link>
                <Link href="/groups"><span>♧</span> Explore groups</Link>
              </div>
            </div>
          </section>

          <section className="connectExploreSection">
            <div className="connectSectionHeading"><div><span>MAKE IT YOURS</span><h2>Explore Connect</h2><p>Move between the spaces that bring your interests together.</p></div><Link href="/account">Your account →</Link></div>
            <div className="connectExploreGrid">
              {exploreLinks.map(item => (
                <Link href={item.href} key={item.title} className="connectExploreCard">
                  <span className={"connectExploreIcon " + item.tone}>{item.icon}</span>
                  <span className="connectExploreText"><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <span className="connectExploreArrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="connectDynamicPanel connectPulsePanel">
            <div className="connectSectionHeading"><div><span>YOUR DAILY SNAPSHOT</span><h2>Weather, scores & markets</h2><p>Quick updates in one compact dashboard.</p></div></div>
            <div className="connectPulseGrid">
              <RegionalWeather compact />
              <SportsScores compact />
              <MarketSnapshot />
            </div>
          </section>

          <section className="connectDynamicPanel">
            <div className="connectSectionHeading"><div><span>WHAT&apos;S HAPPENING</span><h2>Stories from around the world</h2><p>Current headlines from public publishers and feeds.</p></div><Link href="/news">All news →</Link></div>
            <LiveNewsArticles compact />
          </section>

          <section className="connectDynamicPanel">
            <div className="connectSectionHeading"><div><span>YOUR INTERESTS</span><h2>Watch what you love</h2><p>Choose topics and explore official broadcaster and video sources.</p></div><Link href="/free-tv">Explore video →</Link></div>
            <LiveInterestFeed />
          </section>

          <section className="connectDynamicPanel connectPulsePanel">
            <div className="connectSectionHeading"><div><span>YOUR DAILY SNAPSHOT</span><h2>Weather, scores & markets</h2><p>Quick updates in one compact dashboard.</p></div></div>
            <div className="connectPulseGrid">
              <RegionalWeather compact />
              <SportsScores compact />
              <MarketSnapshot />
            </div>
          </section>
        </section>

        <aside className="connectRightRail" aria-label="Connect information">
          <section className="connectRightCard connectMemberCard">
            <div className="connectRightCardHead"><span>THE CONNECT COMMUNITY</span><b>◉</b></div>
            <MemberCount />
            <p>Discover people, interests and new perspectives across the platform.</p>
            <Link href="/discover">Discover members →</Link>
          </section>
          <section className="connectRightCard">
            <div className="connectRightTitle">Start connecting</div>
            <Link className="connectQuickLink" href="/discover"><span>⌕</span><div><strong>Discover people</strong><small>Find members and shared interests</small></div></Link>
            <Link className="connectQuickLink" href="/friends"><span>♧</span><div><strong>Friends</strong><small>Build your personal network</small></div></Link>
            <Link className="connectQuickLink" href="/messages"><span>✉</span><div><strong>Messages</strong><small>Keep up with your connections</small></div></Link>
            <Link className="connectQuickLink" href="/dating"><span>♡</span><div><strong>Dating</strong><small>Meet verified adult members</small></div></Link>
          </section>
          <section className="connectRightCard connectRegionCard">
            <div className="connectRightTitle">Your regional edition</div>
            <p>Choose your country and language to tailor regional information.</p>
            <LanguageSwitcher />
          </section>
          <section className="connectRightCard connectCommunityStandards">
            <span className="connectStandardsIcon">✓</span><strong>A better community starts with respect.</strong>
            <p>Harassment, threats, intimidation and privacy violations are not allowed.</p>
            <Link href="/community-guidelines">Read the Community Guidelines →</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
