import Link from "next/link";

const destinations = [
  { icon: "📺", title: "Free TV worldwide", description: "Explore official public broadcasters, live news services and free entertainment destinations. Watch on each broadcaster&apos;s own website, with regional availability and rights respected.", href: "/free-tv", action: "Browse TV channels", tone: "tv" },
  { icon: "📻", title: "Free internet radio", description: "Search community-listed stations by country, language and genre. Play streams in the browser, save favorites and discover local voices from around the world.", href: "/radio", action: "Listen to radio", tone: "radio" },
];

export default function MediaHubPage() {
  return <main className="mediaHub">
    <header className="mediaHubHeader"><Link href="/" className="mediaHubBrand"><span>◉</span> ConnectTime</Link><nav><Link href="/">Home</Link><Link href="/free-tv">Free TV</Link><Link href="/radio">Radio</Link><Link href="/videos">Video Tube</Link><Link href="/news">News</Link><Link href="/register" className="mediaHubJoin">Register Now</Link></nav></header>
    <section className="mediaHubHero">
      <span className="mediaHubEyebrow">CONNECTTIME · FREE MEDIA</span>
      <h1>Listen local.<br/><em>Watch worldwide.</em></h1>
      <p>Discover free radio streams and official free-to-watch TV services in one place. Explore broadcasters, find stations by country or language, and enjoy media directly from its source.</p>
      <div className="mediaHubPills"><span>📻 Browser radio players</span><span>📺 Official TV destinations</span><span>🌍 Global discovery</span><span>☆ Saved favorites</span></div>
    </section>
    <section className="mediaHubChoices"><div className="mediaHubIntro"><span>YOUR MEDIA, YOUR WAY</span><h2>Choose what you want to explore.</h2><p>ConnectTime helps you discover media without hosting or rebroadcasting third-party content.</p></div>
      <div className="mediaHubGrid">{destinations.map(item=><article className={"mediaHubCard "+item.tone} key={item.title}><div className="mediaHubIcon">{item.icon}</div><span className="mediaHubTag">FREE DISCOVERY</span><h2>{item.title}</h2><p>{item.description}</p><Link href={item.href}>{item.action} <span>→</span></Link></article>)}</div>
    </section>
    <section className="mediaHubHow"><div><span>HOW IT WORKS</span><h2>Free discovery.<br/>Direct from the source.</h2></div><ol><li><b>Explore</b><p>Search the radio directory or browse TV channels by region, country and category.</p></li><li><b>Play or visit</b><p>Radio plays through the station&apos;s public stream. TV opens the broadcaster's official service.</p></li><li><b>Save your favorites</b><p>Keep a personal list of radio stations and TV channels where the feature is available.</p></li></ol></section>
    <section className="mediaHubNotice"><b>Availability, licensing and regional restrictions</b><p>“Free” refers to a broadcaster or station that lists a free listening or viewing option. Availability, advertisements, account requirements, schedules, licensing and geographic restrictions are controlled by each provider and may change. ConnectTime does not own, record, bypass restrictions on, or rebroadcast third-party streams. Some destinations may not be available in every country.</p></section>
    <footer className="mediaHubFooter"><Link href="/">ConnectTime</Link><span>© {new Date().getFullYear()} Techcyber LLC</span><div><Link href="/safety">Safety</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></div></footer>
  </main>;
}
