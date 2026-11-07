import Link from "next/link";
import LiveInterestFeed from "./components/live-interest-feed";

const destinations = [
  { icon: "🌐", title: "Connect with people", description: "Meet members, discover shared interests, build friendships and grow your community.", href: "/discover", action: "Discover members" },
  { icon: "💬", title: "Join the conversation", description: "Share updates, react, comment and take part in community discussions.", href: "/community", action: "Explore community" },
  { icon: "👥", title: "Build your communities", description: "Discover interest-based groups, meet members and join focused discussions.", href: "/groups", action: "Explore groups" },
  { icon: "✉️", title: "Stay connected", description: "Manage friend requests and continue private conversations with your connections.", href: "/messages", action: "Open messages" },
  { icon: "📺", title: "Watch and explore", description: "Find news, entertainment and official broadcaster streams, plus video discovery.", href: "/free-tv", action: "Explore TV & video" },
  { icon: "🎯", title: "Your personalized live feed", description: "Choose interests across news, sports, entertainment, music, business and science.", href: "#live-interest", action: "Explore live feeds" },
  { icon: "📰", title: "Stay informed", description: "Browse current affairs and news topics from a range of publishers.", href: "/news", action: "Read the news" },
  { icon: "🎉", title: "Discover what's happening", description: "Explore community events and find activities and conversations to join.", href: "/events", action: "Explore events" },
  { icon: "📣", title: "Promote your ideas", description: "Explore advertising options and campaign tools for reaching an audience.", href: "/advertise", action: "Advertise on ConnectTime" },
];

export default function HomePage() {
  return <main className="ctHome">
    <header className="ctHomeHeader">
      <Link href="/" className="ctHomeBrand"><span className="ctHomeMark">◉</span><span>ConnectTime<small>Your people. Your passions. Your ConnectTime.</small></span></Link>
      <nav aria-label="Main navigation"><Link href="/community">Community</Link><Link href="/news">News</Link><Link href="/free-tv">TV & Video</Link><Link href="/groups">Groups</Link><Link href="/advertise">Advertise</Link><Link href="/login">Log in</Link><Link className="ctHomeRegister" href="/register">Register Now</Link></nav>
    </header>
    <section className="ctHomeHero">
      <div className="ctHomeHeroCopy"><span className="ctHomeEyebrow">THE ALL-IN-ONE MEDIA APPLICATION</span><h1>Your world.<br/><em>All in one place.</em></h1><p>ConnectTime is an all-in-one media application bringing social networking, private messaging, communities, news, live-interest video feeds, entertainment, TV discovery and events together in one place.</p><div className="ctHomeActions"><Link href="/register" className="ctHomePrimary">Join ConnectTime <span>→</span></Link><Link href="/community" className="ctHomeSecondary">Explore the platform</Link></div><div className="ctHomeTrust"><span>🌍 Global perspectives</span><span>💬 Real conversations</span><span>🎬 Media discovery</span></div></div>
      <div className="ctHomeHeroVisual" aria-label="ConnectTime brings together community, media and discovery"><div className="ctHomeOrb">CT</div><div className="ctHomeFloat ctHomeFloatOne"><b>📰</b><span>News & stories</span></div><div className="ctHomeFloat ctHomeFloatTwo"><b>📺</b><span>TV & video</span></div><div className="ctHomeFloat ctHomeFloatThree"><b>💬</b><span>People & community</span></div><div className="ctHomeFloat ctHomeFloatFour"><b>🎵</b><span>Entertainment</span></div></div>
    </section>
    <section className="ctHomeIntro"><span>MORE THAN A SOCIAL NETWORK</span><h2>Social connection meets your daily media hub.</h2><p>Catch up on the latest, find something to watch, share your point of view and connect around what matters to you.</p></section>
    <section className="ctHomeGrid">{destinations.map(item=><article className="ctHomeCard" key={item.title}><span className="ctHomeCardIcon">{item.icon}</span><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.action} <span>→</span></Link></article>)}</section>
    <div id="live-interest" className="ctHomeLiveFeed"><LiveInterestFeed /></div>
    <section className="ctHomeFeatureBand"><div><span>BUILT AROUND YOUR INTERESTS</span><h2>Follow what you love.<br/><em>Find what inspires you.</em></h2><p>Personalize your live-interest feed, explore topics from around the world and discover new communities at your own pace.</p><Link href="/news">Explore your interests →</Link></div><div className="ctHomeFeatureTiles"><div>🌍<b>Global news</b><small>Perspectives from around the world</small></div><div>🏟️<b>Sports & culture</b><small>Follow the topics you care about</small></div><div>🎥<b>Video discovery</b><small>Find media from official sources</small></div><div>🤝<b>Shared interests</b><small>Connect with your communities</small></div></div></section>
    <section className="ctHomeFinal"><span>YOUR PEOPLE. YOUR PASSIONS. YOUR CONNECTTIME.</span><h2>Bring your world together.</h2><p>Create your account and explore an all-in-one destination for connection and media.</p><Link href="/register">Register Now <span>→</span></Link><small>Adults 18+. Some features are in development and availability varies by region and provider.</small></section>
    <footer className="ctHomeFooter"><Link href="/">ConnectTime</Link><span>© {new Date().getFullYear()} Techcyber LLC</span><div><Link href="/safety">Safety</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link><Link href="/account">Account</Link></div></footer>
  </main>;
}
