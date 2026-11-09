import Link from "next/link";

const services = [
  { name: "Apple TV", category: "Apple Originals, films & live sports", url: "https://tv.apple.com/", color: "#252535", mark: "tv+", note: "An Apple TV subscription is required for subscription content; availability varies by region." },
  { name: "YouTube TV", category: "Live TV, sports, news & cloud DVR", url: "https://tv.youtube.com/", color: "#f5f5f5", mark: "▶ TV", note: "A YouTube TV membership is required; channel lineups and availability vary by location." },
  { name: "Hulu", category: "TV shows, movies & originals", url: "https://www.hulu.com/", color: "#1ce783", mark: "hulu", note: "A Hulu plan may be required. Plan and title availability vary." },
  { name: "Netflix", category: "Series, films & documentaries", url: "https://www.netflix.com/", color: "#e50914", mark: "N", note: "Sign in with your Netflix account and active plan." },
  { name: "Tubi", category: "Free movies & TV with ads", url: "https://tubitv.com/", color: "#6b36ff", mark: "tubi", note: "Free, ad-supported viewing; no paid subscription required." },
  { name: "Disney+", category: "Disney, Pixar, Marvel & more", url: "https://www.disneyplus.com/", color: "#173b8f", mark: "Disney+", note: "A Disney+ subscription is required for subscription content." },
  { name: "Amazon Prime Video", category: "Movies, series & rentals", url: "https://www.primevideo.com/", color: "#00a8e1", mark: "prime", note: "Prime membership or a separate purchase/channel may be required for some titles." },
  { name: "Paramount+", category: "Shows, movies & live sports", url: "https://www.paramountplus.com/", color: "#1765c1", mark: "P+", note: "A Paramount+ plan is required for subscription content." },
  { name: "Peacock", category: "NBC shows, movies & live events", url: "https://www.peacocktv.com/", color: "#202033", mark: "peacock", note: "A Peacock plan may be required; available content depends on plan and region." },
];

export default function AppsWatchPage() {
  return <main className="appsWatchPage">
    <header className="appsWatchHeader"><Link href="/" className="appsWatchBrand">🌐 Connect</Link><nav><Link href="/">Home</Link><Link href="/free-tv">TV &amp; Video</Link><Link href="/login">Log in</Link></nav></header>
    <section className="appsWatchHero">
      <span className="appsWatchEyebrow">YOUR STREAMING DESTINATION</span>
      <h1>Apps <em>Watch</em></h1>
      <p>One convenient place to open the streaming services you already use. Choose an app, sign in securely on its official website, and enjoy movies and shows with your own account.</p>
      <div className="appsWatchNotice"><strong>Your subscriptions stay yours.</strong><span>Connect does not sell streaming subscriptions, store provider passwords, or unlock paid content. Each provider controls sign-in, playback, plans and regional availability.</span></div>
    </section>
    <section className="appsWatchSection">
      <div className="appsWatchSectionTitle"><div><span>STREAMING SERVICES</span><h2>Choose where to watch</h2></div><small>9 services</small></div>
      <div className="appsWatchGrid">
        {services.map(service => <article className="appsWatchCard" key={service.name}>
          <div className="appsWatchLogo" style={{"--service-color":service.color} as React.CSSProperties}><b>{service.mark}</b></div>
          <div className="appsWatchCardBody"><h3>{service.name}</h3><p className="appsWatchCategory">{service.category}</p><p className="appsWatchNote">{service.note}</p><a href={service.url} target="_blank" rel="noopener noreferrer">Open official app <span aria-hidden="true">↗</span></a></div>
        </article>)}
      </div>
    </section>
    <section className="appsWatchHow"><h2>How Apps Watch works</h2><ol><li><b>Choose a streaming service.</b> Select one of the official providers above.</li><li><b>Sign in with the provider.</b> Your credentials are entered only on the provider’s own website or app.</li><li><b>Watch with your plan.</b> The provider verifies your subscription and decides what you can stream.</li></ol></section>
    <footer className="appsWatchFooter"><Link href="/">Connect</Link><span>© {new Date().getFullYear()} Techcyber LLC</span><small>Streaming brands belong to their respective owners. Connect is not affiliated with or endorsed by these providers. Playback and catalogs vary by country, plan, device and title.</small></footer>
    <style>{`
      .appsWatchPage{min-height:100vh;background:#f5f9fc;color:#15334a;padding:0 clamp(16px,4vw,56px);font-family:Arial,sans-serif}
      .appsWatchHeader{height:76px;max-width:1180px;margin:auto;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce8ef}
       .appsWatchBrand{font-size:22px;font-weight:800;letter-spacing:-.7px;color:#123b59}.appsWatchHeader nav{display:flex;gap:22px;font-size:13px;font-weight:700;color:#46647a}
      .appsWatchHero{max-width:1180px;margin:28px auto 38px;padding:58px clamp(24px,6vw,76px);border:1px solid #d9eaf3;border-radius:28px;background:radial-gradient(circle at 82% 18%,#c6f0fc 0,transparent 34%),linear-gradient(120deg,#e5f5fc,#f6faff 62%,#e6f2fb)}.appsWatchEyebrow,.appsWatchSectionTitle span{font-size:10px;font-weight:800;letter-spacing:1.8px;color:#0783b9}
       .appsWatchHero h1{font-size:clamp(44px,7vw,72px);letter-spacing:-3px;margin:12px 0;color:#113a58}.appsWatchHero h1 em{font-style:normal;color:#0789c6}
      .appsWatchHero>p{max-width:690px;color:#58748a;font-size:16px;line-height:1.75}
      .appsWatchNotice{display:flex;flex-direction:column;gap:5px;max-width:760px;margin-top:25px;padding:17px 20px;border:1px solid #c9dce9;border-radius:15px;background:#ffffffd9;box-shadow:0 8px 28px #1643600b}.appsWatchNotice strong{font-size:13px}.appsWatchNotice span{font-size:12px;line-height:1.6;color:#58748a}
      .appsWatchSection,.appsWatchHow{max-width:1180px;margin:0 auto;padding:30px 0}.appsWatchSectionTitle{display:flex;align-items:end;justify-content:space-between;margin-bottom:18px} .appsWatchSectionTitle h2,.appsWatchHow h2{font-size:26px;letter-spacing:-1px;margin:7px 0 0;color:#143c58}.appsWatchSectionTitle small{font-size:12px;color:#7590a4}
      .appsWatchGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      .appsWatchCard{display:flex;gap:16px;align-items:flex-start;min-width:0;padding:19px;border:1px solid #e0ebf2;border-radius:18px;background:#fff;box-shadow:0 10px 25px #16436008}
      .appsWatchLogo{display:grid;place-items:center;flex:0 0 66px;height:66px;border-radius:15px;background:var(--service-color);color:#fff;font-size:17px;text-align:center;overflow:hidden;box-shadow:0 6px 16px #16436018}
      .appsWatchLogo b{max-width:60px;overflow-wrap:anywhere}.appsWatchCardBody{min-width:0;flex:1} .appsWatchCard h3{font-size:16px;letter-spacing:-.3px;margin:1px 0 5px;color:#153b56} .appsWatchCategory{font-size:11px;font-weight:700;color:#466b82;margin:0 0 9px}.appsWatchNote{font-size:11px;line-height:1.55;color:#668095;margin:0 0 12px}
       .appsWatchCard a{display:inline-flex;gap:8px;align-items:center;color:#087eb9;font-size:12px;font-weight:800}.appsWatchCard a:hover{text-decoration:underline}
      .appsWatchHow{margin-top:12px;padding:24px;border:1px solid #e0ebf2;border-radius:18px;background:#fff}.appsWatchHow ol{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding-left:20px;color:#58748a;font-size:12px;line-height:1.65}.appsWatchHow li{padding-right:10px} .appsWatchHow b{color:#153b56}
      .appsWatchPage{background:#f5f9fc;color:#15334a}
      .appsWatchHeader nav a{color:#46647a}
      .appsWatchHero h1{color:#113a58}
      .appsWatchHero>p{color:#58748a}
      .appsWatchSectionTitle h2,.appsWatchHow h2{color:#143c58}
      .appsWatchCard h3{color:#153b56}
      .appsWatchCategory{color:#466b82}
      .appsWatchNote,.appsWatchNotice span,.appsWatchHow ol{color:#668095}
      .appsWatchHow b{color:#153b56}
      .appsWatchFooter{color:#7590a4}
      .appsWatchFooter{max-width:1180px;margin:35px auto 0;padding:24px 0 36px;border-top:1px solid #dce8ef;display:flex;gap:18px;align-items:center;flex-wrap:wrap;color:#7590a4;font-size:11px}.appsWatchFooter>a{font-weight:800;color:#123b59}.appsWatchFooter small{flex-basis:100%;line-height:1.5}
      @media(max-width:900px){.appsWatchGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.appsWatchHeader{height:66px}.appsWatchHeader nav{gap:13px;font-size:11px}.appsWatchHero{padding-top:48px}.appsWatchGrid{grid-template-columns:1fr}.appsWatchHow ol{grid-template-columns:1fr;gap:10px}.appsWatchCard{padding:16px}.appsWatchLogo{flex-basis:58px;height:58px}}
    `}</style>
  </main>;
}
