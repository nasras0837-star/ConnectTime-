import Link from "next/link";
import LiveInterestFeed from "./components/live-interest-feed";
import LiveNewsArticles from "./components/live-news-articles";
import SportsScores from "./components/sports-scores";
import RegionalWeather from "./components/regional-weather";
import { MemberCount } from "./components/member-count";

const destinations = [
  { icon: "❤️", title: "Dating & mutual likes", description: "Find compatible adults by age, interests, location and relationship goals. Like someone and connect when the interest is mutual.", href: "/dating", action: "Explore dating" },
  { icon: "🌐", title: "Connect with people", description: "Meet members, discover shared interests, build friendships and grow your community.", href: "/discover", action: "Discover members" },
  { icon: "🛍️", title: "Buy & sell in Marketplace", description: "List and discover lawful goods and property, from real estate and cars to electronics, furniture, clothing, comics and sports cards.", href: "/marketplace", action: "Explore Marketplace" },
  { icon: "💬", title: "Join the conversation", description: "Share updates, react, comment and take part in community discussions.", href: "/community", action: "Explore community" },
  { icon: "👥", title: "Build your communities", description: "Discover interest-based groups, meet members and join focused discussions.", href: "/groups", action: "Explore groups" },
  { icon: "💬", title: "Text chat & private messages", description: "Send private text messages and keep conversations going with friends you have connected with.", href: "/messages", action: "Start a text chat" },
  { icon: "🎥", title: "Video chat & group meetings", description: "See and talk with friends and family in private group video meetings across countries and time zones. Create a room and invite everyone with one link.", href: "/meetings", action: "Start video chat" },
  { icon: "📺", title: "Watch and explore", description: "Find news, entertainment and official broadcaster streams, plus video discovery.", href: "/free-tv", action: "Explore TV & video" },
  { icon: "🎵", title: "Free music & radio", description: "Tune into local radio and free music streams from countries and cultures around the world.", href: "/radio", action: "Listen worldwide" },
  { icon: "🎯", title: "Your personalized live feed", description: "Choose interests across news, sports, entertainment, music, business and science.", href: "#live-interest", action: "Explore live feeds" },
  { icon: "📰", title: "Stay informed", description: "Browse current affairs and news topics from a range of publishers.", href: "/news", action: "Read the news" },
  { icon: "🎉", title: "Discover what's happening", description: "Explore community events and find activities and conversations to join.", href: "/events", action: "Explore events" },
  { icon: "🎯", title: "Smart advertising", description: "Plan campaigns around audience interests, regions and business goals. Explore targeting options and campaign tools, with review before launch.", href: "/advertise", action: "Explore smart advertising" },
];

export default function HomePage() {
  return <main className="ctHome">
    <header className="ctHomeHeader">
      <Link href="/" className="ctHomeBrand"><img className="ctHomeLogo" src="/connect-logo.svg" alt="Connect — Meet people worldwide. Discover. Share. Connect." /></Link>
      <nav aria-label="Main navigation"><Link href="/community">Community</Link><Link href="/news">News</Link><Link href="/free-tv">TV & Video</Link><Link href="/radio">Music & Radio</Link><Link href="/groups">Groups</Link><Link href="/dating">Dating</Link><Link href="/marketplace">Marketplace</Link><Link href="/meetings">Group Meetings</Link><Link href="/advertise">Advertise</Link><Link href="/feedback">Feedback</Link><Link href="/login">Log in</Link><Link className="ctHomeRegister" href="/register">Register Now</Link></nav>
    </header>
    <section className="ctHomeHero">
      <div className="ctHomeHeroCopy"><span className="ctHomeEyebrow">THE ALL-IN-ONE MEDIA APPLICATION</span><h1>Your global social world,<br/><em>all in one place.</em></h1><p>Connect is an all-in-one media application bringing social networking, private messaging, communities, news, live-interest video feeds, entertainment, TV discovery and events together in one place.</p><div className="ctHomeActions"><Link href="/register" className="ctHomePrimary">Join Connect <span>→</span></Link><Link href="/community" className="ctHomeSecondary">Explore the platform</Link></div>
      <div className="ctHomeFeatureHighlights" aria-label="Connect features"><Link href="/discover">People &amp; communities</Link><span aria-hidden="true">✦</span><Link href="/messages">Private text chat</Link><span aria-hidden="true">✦</span><Link href="/meetings">Video chat worldwide</Link><span aria-hidden="true">✦</span><Link href="/news">News, TV &amp; video</Link></div><div className="ctHomeTrust"><span>🌍 Global perspectives</span><span>💬 Private text chat</span><span>🎥 Group video chat</span><span>🎬 Media discovery</span><span>🎯 Smart advertising</span></div></div>
      <div className="ctHomeHeroVisual" aria-label="Connect brings together community, media and discovery"><div className="ctHomeOrb">CT</div><div className="ctHomeFloat ctHomeFloatOne"><b>📰</b><span>News & stories</span></div><div className="ctHomeFloat ctHomeFloatTwo"><b>📺</b><span>TV & video</span></div><div className="ctHomeFloat ctHomeFloatThree"><b>💬</b><span>People & community</span></div><div className="ctHomeFloat ctHomeFloatFour"><b>🎵</b><span>Entertainment</span></div></div>
    </section>
    <div style={{display:"flex",justifyContent:"center",padding:"0 20px 28px"}}><MemberCount /></div>
    <SportsScores />
    <RegionalWeather />
    <section className="ctHomeIntro"><span>MORE THAN A SOCIAL NETWORK</span><h2>Social connection meets your daily media hub.</h2><p>Catch up on the latest, find something to watch, share your point of view and connect around what matters to you.</p></section>
    <section className="ctHomeSmartAds"><div className="ctHomeAdIcon">✦</div><div><span>FOR BUSINESSES, CREATORS & ORGANIZATIONS</span><h2>Smart advertising that helps you reach the right audience.</h2><p>Explore campaign planning built around audience interests, geographic reach and your marketing goals. Review your campaign options and submit it for approval before launch.</p><div className="ctHomeAdPills"><b>Interest-led planning</b><b>Regional reach</b><b>Campaign insights</b></div></div><Link href="/advertise">Explore smart advertising <span>→</span></Link></section>
    <section className="ctHomeGrid">{destinations.map(item=><article className="ctHomeCard" key={item.title}><span className="ctHomeCardIcon">{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action} <span>→</span></Link></article>)}</section>
    <div id="live-interest" className="ctHomeLiveFeed"><LiveInterestFeed /></div>
    <LiveNewsArticles />
    <section className="ctHomeFeatureBand"><div><span>BUILT AROUND YOUR INTERESTS</span><h2>Follow what you love.<br/><em>Find what inspires you.</em></h2><p>Personalize your live-interest feed, explore topics from around the world and discover new communities at your own pace.</p><Link href="/news">Explore your interests →</Link></div><div className="ctHomeFeatureTiles"><div>🌍<b>Global news</b><small>Perspectives from around the world</small></div><div>🏟️<b>Sports & culture</b><small>Follow the topics you care about</small></div><div>🎥<b>Video discovery</b><small>Find media from official sources</small></div><div>🤝<b>Shared interests</b><small>Connect with your communities</small></div></div></section>
    <section className="ctHomeFinal"><span>YOUR PEOPLE. YOUR PASSIONS. YOUR CONNECT.</span><h2>Bring your world together.</h2><p>Create your account and explore an all-in-one destination for connection and media.</p><Link href="/register">Register Now <span>→</span></Link><small>Adults 18+. Some features are in development and availability varies by region and provider.</small></section>
    <footer className="ctHomeFooter"><Link href="/">Connect</Link><span>© {new Date().getFullYear()} Techcyber LLC</span><div><Link href="/safety">Safety</Link><Link href="/feedback">Feedback</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/account">Account</Link></div></footer>
  </main>;
}
