import Link from "next/link";

const plannedTools = [
  { icon: "🛍️", title: "Community listings", description: "Explore products and services shared by the ConnectTime community." },
  { icon: "🌎", title: "Discover worldwide", description: "Find listings from different places and communities as the directory expands." },
  { icon: "🤝", title: "Connect with sellers", description: "A future contact flow will help members ask questions and learn more about listings." },
];

export default function MarketplacePage() {
  return (
    <main className="marketplacePage">
      <header className="marketplaceHeader">
        <Link href="/" className="marketplaceBrand" aria-label="ConnectTime home">🌐 <span>ConnectTime</span></Link>
        <nav aria-label="Marketplace navigation"><Link href="/">Home</Link><Link href="/news">News</Link><Link href="/events">Events</Link><Link href="/videos">Video Tube</Link><Link className="marketplaceJoin" href="/register">Register Now</Link></nav>
      </header>
      <section className="marketplaceHero">
        <span>CONNECTTIME · COMMUNITY MARKETPLACE</span>
        <h1>Discover more.<br/><em>Support your community.</em></h1>
        <p>A place for community listings, products, and services. We’re preparing the marketplace experience and its safety and transaction controls.</p>
        <div className="marketplaceStatus">Marketplace preview · Listings and transactions are not active yet</div>
      </section>
      <section className="marketplaceContent">
        <div className="marketplaceSectionTitle"><span>WHAT’S COMING</span><h2>A marketplace built around community</h2><p>We’re building the foundations before opening listings or purchases.</p></div>
        <div className="marketplaceFeatureGrid">{plannedTools.map((item) => <article className="marketplaceFeature" key={item.title}><div>{item.icon}</div><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        <section className="marketplaceSafety"><div><span>SAFETY FIRST</span><h2>Trust and transparency before transactions.</h2><p>Listings, seller identity checks, reporting, moderation, payment handling, refunds, and dispute processes must be tested before any buying or selling is enabled.</p></div><Link href="/community-guidelines">Visit Safety Center ↗</Link></section>
      </section>
      <footer className="marketplaceFooter">© {new Date().getFullYear()} ConnectTime · Marketplace preview · Adults 18+</footer>
    </main>
  );
}
