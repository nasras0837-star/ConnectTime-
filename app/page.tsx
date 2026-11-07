import Link from "next/link";

const features = [
  ["Community", "Share updates, daily blogs, photos and conversations."],
  ["Friends", "Discover people and build meaningful global connections."],
  ["Marketplace", "Explore goods and services from your local community."],
  ["Match Maker", "Meet people seeking the kind of relationship you want."],
  ["ConnectTime TV", "Follow creators, watch shows and discover new channels."],
  ["Live", "Join live conversations and community broadcasts."],
];

export default function HomePage() {
  return <main className="shell">
    <header className="header"><Link className="logo" href="/">Connect<span>Time</span></Link><nav><Link href="/login">Log in</Link><Link className="navButton" href="/signup">Create account</Link></nav></header>
    <section className="hero">
      <div className="eyebrow">ONE WORLD. MORE WAYS TO CONNECT.</div>
      <h1>Your world,<br/><span>connected.</span></h1>
      <p>Meet people, share your story, discover your interests and build community across borders.</p>
      <div className="heroActions"><Link className="button" href="/signup">Get started</Link><Link className="textLink" href="#features">Explore ConnectTime →</Link></div>
      <div className="adultNote">ConnectTime is designed for adults 18 and older. Secure age eligibility verification is required before full access.</div>
    </section>
    <section id="features" className="features"><div className="sectionIntro"><div className="eyebrow">A PLACE FOR EVERY CONNECTION</div><h2>More than a social feed.</h2><p>One home for the people, interests and opportunities that bring us together.</p></div><div className="featureGrid">{features.map(([title, description], i) => <article className="feature" key={title}><div className="featureNumber">0{i+1}</div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <footer>© {new Date().getFullYear()} ConnectTime · Built for a connected world · Adults 18+</footer>
  </main>;
}
