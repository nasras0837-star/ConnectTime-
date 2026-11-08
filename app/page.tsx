import Link from "next/link";
import LiveInterestFeed from "./components/live-interest-feed";
import LiveNewsArticles from "./components/live-news-articles";
import SportsScores from "./components/sports-scores";
import { MemberCount } from "./components/member-count";

const featureGroups = [
  {
    id: "connect",
    eyebrow: "MEET, MESSAGE & BELONG",
    title: "Connect with people",
    description: "Build relationships, keep in touch and find communities around the things you care about.",
    items: [
      { icon: "🌍", title: "Discover members", description: "Meet people worldwide, explore profiles and find shared interests.", href: "/discover", action: "Discover people" },
      { icon: "❤️", title: "Dating & mutual likes", description: "Find compatible adults by age, interests, location and relationship goals.", href: "/dating", action: "Explore dating" },
      { icon: "💬", title: "Messages & text chat", description: "Keep conversations going with private messages and connected friends.", href: "/messages", action: "Open messages" },
      { icon: "🎥", title: "Video chat & meetings", description: "Meet face-to-face in private group video rooms and invite people with a link.", href: "/meetings", action: "Start a meeting" },
      { icon: "🗣️", title: "Community discussions", description: "Share updates, react, comment and join conversations.", href: "/community", action: "Visit community" },
      { icon: "👥", title: "Groups & interests", description: "Find people with similar interests and take part in focused discussions.", href: "/groups", action: "Explore groups" }
    ]
  },
  {
    id: "discover",
    eyebrow: "WATCH, LISTEN & TAKE PART",
    title: "Explore more of the world",
    description: "Discover entertainment, culture and activities from different places and communities.",
    items: [
      { icon: "📺", title: "Free TV", description: "Explore official broadcaster streams and television from around the world.", href: "/free-tv", action: "Watch Free TV" },
      { icon: "🎬", title: "ConnectTime Video Tube", description: "Discover videos and media from a range of topics and sources.", href: "/videos", action: "Explore Video Tube" },
      { icon: "🎵", title: "Music & radio", description: "Tune in to radio and music streams from countries and cultures worldwide.", href: "/radio", action: "Listen now" },
      { icon: "🎉", title: "Events", description: "Find activities, community events and opportunities to take part.", href: "/events", action: "Find events" },
      { icon: "🛍️", title: "Marketplace", description: "Browse and list lawful goods and property, from electronics to cars and real estate.", href: "/marketplace", action: "Visit Marketplace" }
    ]
  },
  {
    id: "updates",
    eyebrow: "KEEP UP WITH WHAT MATTERS",
    title: "News, sports & live interests",
    description: "Follow the topics you care about and catch up on current conversations and stories.",
    items: [
      { icon: "📰", title: "News", description: "Browse current affairs and stories from a range of publishers.", href: "/news", action: "Read the news" },
      { icon: "✨", title: "Personalized live feed", description: "Explore news, sports, entertainment, music, business and science by interest.", href: "#live-interest", action: "Explore live interests" }
    ]
  }
];

export default function HomePage() {
  return <main className="ctHome">
    <header className="ctHomeHeader">
      <Link href="/" className="ctHomeBrand" aria-label="Connect homepage">
        <img className="ctHomeLogo" src="/connect-logo.svg" alt="ConnectTime" />
      </Link>
      <nav aria-label="Main navigation">
        <Link href="#connect">Connect</Link>
        <Link href="#discover">Explore</Link>
        <Link href="#updates">News &amp; interests</Link>
        <Link href="/advertise">For business</Link>
        <Link href="/feedback">Feedback</Link>
        <Link href="/login">Log in</Link>
        <Link className="ctHomeRegister" href="/register">Register Now</Link>
      </nav>
    </header>

    <section className="ctHomeHero" aria-labelledby="home-title">
      <div className="ctHomeHeroCopy">
        <span className="ctHomeEyebrow">MEET PEOPLE. DISCOVER MORE. STAY CONNECTED.</span>
        <h1 id="home-title">Your world,<br /><em>all connected.</em></h1>
        <p>Meet people, build communities, message friends, explore entertainment and stay informed — all from one place.</p>
        <div className="ctHomeActions">
          <Link href="/register" className="ctHomePrimary">Register Now <span>→</span></Link>
          <Link href="#connect" className="ctHomeSecondary">Explore features</Link>
        </div>
        <div className="ctHomeTrust">
          <span>🌍 People worldwide</span><span>💬 Private messaging</span><span>🎥 Video meetings</span><span>📺 Media discovery</span>
        </div>
      </div>
      <div className="ctHomeHeroVisual" aria-hidden="true">
        <div className="ctHomeOrb">CT</div>
        <div className="ctHomeFloat ctHomeFloatOne"><b>📰</b><span>News &amp; stories</span></div>
        <div className="ctHomeFloat ctHomeFloatTwo"><b>📺</b><span>TV &amp; video</span></div>
        <div className="ctHomeFloat ctHomeFloatThree"><b>💬</b><span>People &amp; community</span></div>
        <div className="ctHomeFloat ctHomeFloatFour"><b>🎵</b><span>Music &amp; culture</span></div>
      </div>
    </section>

    <div className="ctHomeMemberCount"><MemberCount /></div>
    <section className="ctHomeHighlights" aria-label="Platform highlights">
      <div><strong>One account</strong><span>for your social world</span></div>
      <div><strong>Many ways</strong><span>to connect and discover</span></div>
      <div><strong>Worldwide</strong><span>people, media and interests</span></div>
    </section>

    <section className="ctHomeDirectory" aria-labelledby="directory-title">
      <div className="ctHomeDirectoryIntro">
        <span>EXPLORE CONNECT</span>
        <h2 id="directory-title">Everything has its place.</h2>
        <p>Choose a section below to go straight to the features you want.</p>
      </div>
      {featureGroups.map(group => <section className="ctHomeCategory" id={group.id} key={group.id} aria-labelledby={`heading-${group.id}`}>
        <div className="ctHomeCategoryHeading">
          <div><span>{group.eyebrow}</span><h3 id={`heading-${group.id}`}>{group.title}</h3></div>
          <p>{group.description}</p>
        </div>
        <div className="ctHomeGrid">
          {group.items.map(item => <article className="ctHomeCard" key={item.title}>
            <span className="ctHomeCardIcon" aria-hidden="true">{item.icon}</span>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
            <Link href={item.href}>{item.action} <span aria-hidden="true">→</span></Link>
          </article>)}
        </div>
      </section>)}
    </section>

    <section className="ctHomeSmartAds">
      <div className="ctHomeAdIcon" aria-hidden="true">✦</div>
      <div>
        <span>FOR BUSINESSES, CREATORS &amp; ORGANIZATIONS</span>
        <h2>Grow your reach with Connect advertising.</h2>
        <p>Explore campaign planning around audience interests, geographic reach and business goals. Campaigns are reviewed before launch.</p>
        <div className="ctHomeAdPills"><b>Interest-led planning</b><b>Regional reach</b><b>Campaign insights</b></div>
      </div>
      <Link href="/advertise">Explore advertising <span>→</span></Link>
    </section>

    <section className="ctHomeLiveSection" id="live-interest">
      <div className="ctHomeDirectoryIntro"><span>YOUR INTERESTS, YOUR FEED</span><h2>See what’s happening now.</h2><p>Explore live-interest updates and discover topics worth following.</p></div>
      <LiveInterestFeed />
    </section>
    <LiveNewsArticles />
    <SportsScores />

    <section className="ctHomeFinal">
      <span>YOUR PEOPLE. YOUR PASSIONS. YOUR CONNECT.</span>
      <h2>Bring your world together.</h2>
      <p>Create your account and explore a more connected social and media experience.</p>
      <Link href="/register">Register Now <span>→</span></Link>
      <small>Adults 18+. Some features are in development and availability varies by region and provider.</small>
    </section>

    <footer className="ctHomeFooter">
      <Link href="/">ConnectTime</Link>
      <span>© {new Date().getFullYear()} Techcyber LLC</span>
      <div><Link href="/safety">Safety</Link><Link href="/feedback">Feedback</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/account">Account</Link></div>
    </footer>
  </main>;
}
