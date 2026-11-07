"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Channel = {
  id: string;
  name: string;
  country: string;
  region: string;
  category: "News" | "Entertainment";
  language: string;
  description: string;
  url: string;
  access: string;
  local?: boolean;
};

const channels: Channel[] = [
  { id:"abc-us", name:"ABC News Live", country:"United States", region:"North America", category:"News", language:"English", description:"Live US and world news coverage from ABC News.", url:"https://abcnews.go.com/Live", access:"Free official stream" },
  { id:"cbs-us", name:"CBS News 24/7", country:"United States", region:"North America", category:"News", language:"English", description:"Round-the-clock headlines, reporting and special coverage.", url:"https://www.cbsnews.com/live/", access:"Free official stream" },
  { id:"nbc-us", name:"NBC News NOW", country:"United States", region:"North America", category:"News", language:"English", description:"Live news, interviews and breaking-news coverage.", url:"https://www.nbcnews.com/now", access:"Free official stream" },
  { id:"pbs-us", name:"Local PBS stations", country:"United States", region:"North America", category:"Entertainment", language:"English", description:"Find your local public TV station. Live streams are free in the station's service area; availability varies by station.", url:"https://www.pbs.org/stations/", access:"Free; local-area restrictions", local:true },
  { id:"cbc-ca", name:"CBC News", country:"Canada", region:"North America", category:"News", language:"English / French", description:"Canadian public broadcaster news and current affairs.", url:"https://www.cbc.ca/news", access:"Free content; live availability varies" },
  { id:"global-ca", name:"Global News", country:"Canada", region:"North America", category:"News", language:"English", description:"Canadian and local news coverage, including live video where available.", url:"https://globalnews.ca/live/", access:"Free official stream" },
  { id:"sky-uk", name:"Sky News", country:"United Kingdom", region:"Europe", category:"News", language:"English", description:"Live UK and international news.", url:"https://news.sky.com/watch-live", access:"Free official stream" },
  { id:"ard-de", name:"ARD Mediathek Live", country:"Germany", region:"Europe", category:"Entertainment", language:"German", description:"German public television live channels, programmes and culture.", url:"https://www.ardmediathek.de/live", access:"Free; some programmes geo-restricted" },
  { id:"zdf-de", name:"ZDF Live", country:"Germany", region:"Europe", category:"Entertainment", language:"German", description:"Public-service television, documentaries, drama and current affairs.", url:"https://www.zdf.de/live-tv", access:"Free; some programmes geo-restricted" },
  { id:"arte-fr", name:"ARTE", country:"France", region:"Europe", category:"Entertainment", language:"French / German / English", description:"Culture, documentaries, cinema and selected live programming.", url:"https://www.arte.tv/en/live/", access:"Free; programme rights vary by country" },
  { id:"f24-fr", name:"France 24", country:"France", region:"Europe", category:"News", language:"English / French / Arabic / Spanish", description:"International news from France 24.", url:"https://www.france24.com/en/live", access:"Free official stream" },
  { id:"rtve-es", name:"RTVE Play", country:"Spain", region:"Europe", category:"Entertainment", language:"Spanish", description:"Spanish public broadcaster live channels, series and programmes.", url:"https://www.rtve.es/play/", access:"Free; some content geo-restricted" },
  { id:"abc-au", name:"ABC iview", country:"Australia", region:"Asia-Pacific", category:"Entertainment", language:"English", description:"Australian public television, live channels and on-demand programmes.", url:"https://iview.abc.net.au/", access:"Free; Australia availability rules apply" },
  { id:"abcnews-au", name:"ABC News Australia", country:"Australia", region:"Asia-Pacific", category:"News", language:"English", description:"Australian and international news from the ABC.", url:"https://www.abc.net.au/news/", access:"Free official news service" },
  { id:"ndtv-in", name:"NDTV", country:"India", region:"Asia-Pacific", category:"News", language:"English / Hindi", description:"Indian and international news, with live coverage where available.", url:"https://www.ndtv.com/livetv-ndtv24x7", access:"Free official stream" },
  { id:"nhk-jp", name:"NHK WORLD-JAPAN", country:"Japan", region:"Asia-Pacific", category:"News", language:"English", description:"Japanese and international news, documentaries and cultural programmes.", url:"https://www3.nhk.or.jp/nhkworld/en/live/", access:"Free official stream" },
  { id:"tvbrasil-br", name:"TV Brasil", country:"Brazil", region:"Latin America", category:"Entertainment", language:"Portuguese", description:"Brazilian public television, culture, documentaries and programmes.", url:"https://tvbrasil.ebc.com.br/ao-vivo", access:"Free; availability may vary" },
  { id:"tvpublica-ar", name:"TV Pública", country:"Argentina", region:"Latin America", category:"Entertainment", language:"Spanish", description:"Argentina's public television channel and live programming.", url:"https://www.tvpublica.com.ar/", access:"Free; availability may vary" },
  { id:"enca-za", name:"eNCA", country:"South Africa", region:"Africa", category:"News", language:"English", description:"South African and regional news coverage.", url:"https://www.enca.com/live", access:"Free official stream; availability may vary" },
  { id:"citizen-ke", name:"Citizen TV", country:"Kenya", region:"Africa", category:"News", language:"English / Swahili", description:"Kenyan news, current affairs and live coverage.", url:"https://www.citizen.digital/tv", access:"Free official stream; availability may vary" },
  { id:"bbc-uk", name:"BBC News", country:"United Kingdom", region:"Europe", category:"News", language:"English", description:"BBC international and UK news, with live and on-demand coverage where offered.", url:"https://www.bbc.com/news", access:"Free news service; live access varies by service and location" },
  { id:"rte-ie", name:"RTÉ Player", country:"Ireland", region:"Europe", category:"Entertainment", language:"English / Irish", description:"Irish public-service television, news, drama and entertainment.", url:"https://www.rte.ie/player/", access:"Free; some live and on-demand programmes are Ireland-only" },
  { id:"rai-it", name:"RaiPlay", country:"Italy", region:"Europe", category:"Entertainment", language:"Italian", description:"Italian public broadcaster live channels, drama, culture and entertainment.", url:"https://www.raiplay.it/dirette", access:"Free; programme rights vary by location" },
  { id:"npo-nl", name:"NPO Start", country:"Netherlands", region:"Europe", category:"Entertainment", language:"Dutch", description:"Dutch public broadcaster live channels and programmes.", url:"https://npo.nl/start/live", access:"Free; some content is Netherlands-only" },
  { id:"rtp-pt", name:"RTP Play", country:"Portugal", region:"Europe", category:"Entertainment", language:"Portuguese", description:"Portuguese public television, news, culture and entertainment.", url:"https://www.rtp.pt/play/direto", access:"Free; programme rights vary by location" },
  { id:"tv5-fr", name:"TV5MONDE", country:"France", region:"Europe", category:"Entertainment", language:"French", description:"Francophone films, series, culture and selected live programming.", url:"https://www.tv5monde.com/", access:"Free services; availability varies by country" },
  { id:"cna-sg", name:"CNA", country:"Singapore", region:"Asia-Pacific", category:"News", language:"English", description:"Singapore and Asia-Pacific news from Mediacorp.", url:"https://www.channelnewsasia.com/watch", access:"Free official news service; live availability may vary" },
  { id:"kbs-kr", name:"KBS World", country:"South Korea", region:"Asia-Pacific", category:"Entertainment", language:"Korean / English", description:"Korean public broadcaster international programmes, culture and entertainment.", url:"https://world.kbs.co.kr/", access:"Free services; programme availability varies" },
  { id:"arirang-kr", name:"Arirang TV", country:"South Korea", region:"Asia-Pacific", category:"News", language:"English", description:"Korean and international news, culture and current affairs.", url:"https://www.arirang.com/", access:"Free official service; live availability may vary" },
  { id:"taiwanplus-tw", name:"TaiwanPlus", country:"Taiwan", region:"Asia-Pacific", category:"News", language:"English", description:"Taiwan-focused international news, culture and documentaries.", url:"https://www.taiwanplus.com/live", access:"Free official stream; availability may vary" },
  { id:"thaipbs-th", name:"Thai PBS", country:"Thailand", region:"Asia-Pacific", category:"News", language:"Thai / English", description:"Thai public broadcaster news, documentaries and public-interest programming.", url:"https://www.thaipbs.or.th/live", access:"Free official service; availability may vary" },
  { id:"tvri-id", name:"TVRI", country:"Indonesia", region:"Asia-Pacific", category:"Entertainment", language:"Indonesian", description:"Indonesian public television, news, culture and entertainment.", url:"https://www.tvri.go.id/live", access:"Free official service; availability may vary" },
  { id:"tvnz-nz", name:"TVNZ+", country:"New Zealand", region:"Asia-Pacific", category:"Entertainment", language:"English / Māori", description:"New Zealand television, local news, series and entertainment.", url:"https://www.tvnz.co.nz/", access:"Free with regional and account conditions" },
  { id:"rtm-my", name:"RTMKlik", country:"Malaysia", region:"Asia-Pacific", category:"Entertainment", language:"Malay / English", description:"Malaysian public broadcaster live television, news and entertainment.", url:"https://rtmklik.rtm.gov.my/", access:"Free official service; availability may vary" },
  { id:"canalonce-mx", name:"Canal Once", country:"Mexico", region:"Latin America", category:"Entertainment", language:"Spanish", description:"Mexican public television, culture, documentaries and family programming.", url:"https://canalonce.mx/", access:"Free official service; live availability may vary" },
  { id:"tvn-cl", name:"TVN Chile", country:"Chile", region:"Latin America", category:"Entertainment", language:"Spanish", description:"Chilean public television, news and entertainment.", url:"https://www.tvn.cl/en-vivo", access:"Free official stream; availability may vary" },
  { id:"rtvc-co", name:"RTVC / Señal Colombia", country:"Colombia", region:"Latin America", category:"Entertainment", language:"Spanish", description:"Colombian public media, culture, documentaries and national programming.", url:"https://www.rtvc.gov.co/", access:"Free official service; availability may vary" },
  { id:"sabc-za", name:"SABC+", country:"South Africa", region:"Africa", category:"Entertainment", language:"English / local languages", description:"South African public broadcaster live channels, radio and local programmes.", url:"https://www.sabc-plus.com/", access:"Free official service; availability may vary" },
  { id:"channels-ng", name:"Channels Television", country:"Nigeria", region:"Africa", category:"News", language:"English", description:"Nigerian and African news, interviews and current affairs.", url:"https://www.channelstv.com/live/", access:"Free official news stream; availability may vary" },
  { id:"arise-ng", name:"Arise News", country:"Nigeria", region:"Africa", category:"News", language:"English", description:"African and international news and analysis.", url:"https://www.arise.tv/live/", access:"Free official stream; availability may vary" },
  { id:"ntv-ug", name:"NTV Uganda", country:"Uganda", region:"Africa", category:"News", language:"English", description:"Ugandan news, current affairs and regional reporting.", url:"https://www.ntv.co.ug/", access:"Free news service; live availability may vary" },
  { id:"aljazeera-ar", name:"Al Jazeera Arabic", country:"Qatar", region:"Middle East", category:"News", language:"Arabic", description:"Arabic-language international news and current affairs.", url:"https://www.aljazeera.net/live", access:"Free official stream; availability may vary" },
  { id:"sky-arabia", name:"Sky News Arabia", country:"United Arab Emirates", region:"Middle East", category:"News", language:"Arabic", description:"Arabic-language regional and international news.", url:"https://www.skynewsarabia.com/live", access:"Free official service; availability may vary" },
  { id:"asharq-me", name:"Asharq News", country:"Saudi Arabia", region:"Middle East", category:"News", language:"Arabic", description:"Arabic-language news, business and current affairs.", url:"https://asharq.com/", access:"Free official service; live availability may vary" },
  { id:"africanews-global", name:"Africanews", country:"Global", region:"Global", category:"News", language:"English / French", description:"Pan-African and international news coverage.", url:"https://www.africanews.com/", access:"Free official news service; live availability may vary" },
  { id:"dw-global", name:"DW News", country:"Global", region:"Global", category:"News", language:"English / German / Spanish / Arabic", description:"International news and reporting from Deutsche Welle.", url:"https://www.dw.com/en/live-tv/s-100825", access:"Free official stream" },
  { id:"aljazeera-global", name:"Al Jazeera English", country:"Global", region:"Global", category:"News", language:"English", description:"International news and current affairs.", url:"https://www.aljazeera.com/live", access:"Free official stream" },
  { id:"trt-global", name:"TRT World", country:"Global", region:"Global", category:"News", language:"English", description:"International news and analysis.", url:"https://www.trtworld.com/live", access:"Free official stream" },
  { id:"euronews-global", name:"Euronews", country:"Global", region:"Global", category:"News", language:"Multiple languages", description:"European and international news.", url:"https://www.euronews.com/live", access:"Free official stream; availability may vary" },
];

const regions = ["All regions","Global","North America","Europe","Latin America","Asia-Pacific","Africa","Middle East"];
const countries = ["All countries","United States","Canada","United Kingdom","Ireland","Germany","France","Italy","Netherlands","Portugal","Spain","Australia","India","Japan","Singapore","South Korea","Taiwan","Thailand","Indonesia","New Zealand","Malaysia","Brazil","Argentina","Mexico","Chile","Colombia","South Africa","Nigeria","Uganda","Kenya","Qatar","United Arab Emirates","Saudi Arabia"];

export default function FreeTvPage() {
  const [region,setRegion] = useState("All regions");
  const [country,setCountry] = useState("All countries");
  const [category,setCategory] = useState("All");
  const [query,setQuery] = useState("");
  const [watchlist,setWatchlist] = useState<string[]>([]);
  const [watchlistReady,setWatchlistReady] = useState(false);
  const [watchlistError,setWatchlistError] = useState("");
  const [watchlistBusy,setWatchlistBusy] = useState<string | null>(null);
  const [showSavedOnly,setShowSavedOnly] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/free-tv/watchlist", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Watchlist is unavailable.");
      if (active) setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : []);
    }).catch(error => { if (active) setWatchlistError(error instanceof Error ? error.message : "Watchlist is unavailable."); })
      .finally(() => { if (active) setWatchlistReady(true); });
    return () => { active = false; };
  }, []);
  async function toggleSaved(channelId: string) {
    setWatchlistBusy(channelId); setWatchlistError("");
    const saved = watchlist.includes(channelId);
    try {
      const response = await fetch("/api/free-tv/watchlist", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Watchlist update failed.");
      setWatchlist(current => saved ? current.filter(id => id !== channelId) : [...current, channelId]);
    } catch (error) { setWatchlistError(error instanceof Error ? error.message : "Watchlist update failed."); }
    finally { setWatchlistBusy(null); }
  }
  const filtered = useMemo(() => channels.filter((channel) => {
    const matchesRegion = region === "All regions" || channel.region === region || channel.region === "Global";
    const matchesCountry = country === "All countries" || channel.country === country || channel.country === "Global";
    const matchesCategory = category === "All" || channel.category === category;
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [channel.name,channel.country,channel.region,channel.language,channel.description].join(" ").toLowerCase().includes(term);
    return matchesRegion && matchesCountry && matchesCategory && matchesQuery;
  }),[region,country,category,query]);
  return <main className="freeTvPage">
    <header className="freeTvHeader"><Link href="/" className="freeTvBrand"><span>◉</span> ConnectTime</Link><nav><Link href="/">Home</Link><Link href="/news">News</Link><Link href="/videos">Video Tube</Link><Link className="freeTvJoin" href="/register">Register Now</Link></nav></header>
    <section className="freeTvHero"><span className="freeTvEyebrow">CONNECTTIME · FREE TV</span><h1>Local voices.<br/><em>World-wide viewing.</em></h1><p>Discover free official news and entertainment channels from participating broadcasters around the world. Choose a region, find a channel, and watch on the broadcaster&apos;s own service.</p><div className="freeTvHeroStats"><span>🌍 Regional discovery</span><span>📰 Local & world news</span><span>🎭 Free entertainment</span><span>🔗 Official broadcaster links</span></div></section>
    <section className="freeTvDirectory">
      <div className="freeTvSectionHead"><div><span>CHANNEL GUIDE</span><h2>Find something to watch</h2><p>ConnectTime links to the broadcaster. It does not host, record or rebroadcast TV streams. Official destination links receive a scheduled technical check; regional rights and actual live playback still require broadcaster confirmation.</p></div><span className="freeTvCount">{filtered.length} channels</span></div>
      <div className="freeTvWatchlistBar"><button type="button" onClick={() => setShowSavedOnly(false)} aria-pressed={!showSavedOnly}>All channels</button><button type="button" onClick={() => setShowSavedOnly(true)} aria-pressed={showSavedOnly}>★ My watchlist ({watchlist.length})</button><span>{watchlistReady ? "Personal watchlist" : "Loading saved channels…"}</span></div>{watchlistError && <p className="freeTvWatchlistMessage" role="status">{watchlistError} You can still browse the directory.</p>}<div className="freeTvControls"><label>Search channels<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by channel, country or language"/></label><label>Region<select value={region} onChange={e=>setRegion(e.target.value)}>{regions.map(v=><option key={v}>{v}</option>)}</select></label><label>Country<select value={country} onChange={e=>setCountry(e.target.value)}>{countries.map(v=><option key={v}>{v}</option>)}</select></label></div>
      <div className="freeTvTabs" role="group" aria-label="Filter by channel type">{["All","News","Entertainment"].map(v=><button key={v} className={category===v?"active":""} onClick={()=>setCategory(v)} aria-pressed={category===v}>{v==="All"?"🌐":v==="News"?"📰":"🎬"} {v}</button>)}</div>
      <div className="freeTvGrid">{filtered.map(channel=><article className="freeTvCard" key={channel.id}><div className="freeTvCardTop"><span className={channel.category==="News"?"newsType":"entertainmentType"}>{channel.category==="News"?"📰 News":"🎭 Entertainment"}</span><span>{channel.region}</span></div><h3>{channel.name}</h3><div className="freeTvMeta">{channel.country} · {channel.language}</div><p>{channel.description}</p><div className="freeTvAccess">✓ {channel.access}</div><button type="button" className="freeTvSaveButton" onClick={() => toggleSaved(channel.id)} disabled={!watchlistReady || watchlistBusy === channel.id}>{watchlistBusy === channel.id ? "Saving…" : watchlist.includes(channel.id) ? "★ Saved · Remove" : "☆ Save to watchlist"}</button><a href={channel.url} target="_blank" rel="noopener noreferrer">Watch / visit official service ↗</a></article>)}</div>
      {filtered.length===0&&<div className="freeTvEmpty">No channels match those filters. Try a wider region or another search.</div>}
    </section>
    <section className="freeTvLocal"><div><span>YOUR LOCAL PUBLIC TV</span><h2>Start with your own region</h2><p>Some public broadcasters restrict live television to their local service area or country. Use the official station finder or broadcaster website to see what is available where you live.</p></div><a href="https://www.pbs.org/stations/" target="_blank" rel="noopener noreferrer">Find a US PBS station ↗</a></section>
    <section className="freeTvNotice"><b>Availability and rights notice</b><p>“Free” means the broadcaster currently offers an official free viewing option; it does not guarantee every programme is free, available in every country, or playable without an account. Geo-blocking, advertising, registration, schedules and terms are controlled by each broadcaster and may change. ConnectTime does not bypass regional restrictions. Channel names and marks belong to their respective owners. Contact ConnectTime to request a correction or removal.</p></section>
    <footer className="freeTvFooter">© {new Date().getFullYear()} ConnectTime · <Link href="/safety">Safety</Link> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · Adults 18+</footer>
  </main>;
}
