"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type WidgetProps = { src: string; config: Record<string, unknown>; height: number; label: string };
type AnalystResearch = {
  ticker: string;
  consensus: null | {
    consensus_rating?: string;
    consensus_price_target?: number;
    low_price_target?: number;
    high_price_target?: number;
    ratings_contributors?: number;
    price_target_contributors?: number;
    strong_buy_ratings?: number;
    buy_ratings?: number;
    hold_ratings?: number;
    sell_ratings?: number;
    strong_sell_ratings?: number;
  };
  ratings: Array<{
    companyName: string; analyst: string | null; firm: string | null; date: string | null;
    rating: string | null; previousRating: string | null; ratingAction: string | null;
    priceTargetAction: string | null; priceTarget: number | null; previousPriceTarget: number | null;
    currency: string; sourceUrl: string | null;
  }>;
  source: string;
  fetchedAt: string;
};
function TradingViewEmbed({ src, config, height, label }: WidgetProps) {
  const host = useRef<HTMLDivElement>(null);
  const configJson = JSON.stringify(config);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    root.replaceChildren();
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = "100%";
    widget.style.height = "100%";
    const attribution = document.createElement("div");
    attribution.className = "ctMarketAttribution";
    const link = document.createElement("a");
    link.href = "https://www.tradingview.com/widget/";
    link.target = "_blank";
    link.rel = "noopener nofollow";
    link.textContent = "Market data and charts by TradingView";
    attribution.appendChild(link);
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = src;
    script.async = true;
    script.textContent = configJson;
    root.append(widget, attribution, script);
    return () => { root.replaceChildren(); };
  }, [src, configJson]);
  return <div className="ctMarketWidget" style={{ height }} aria-label={label} ref={host}><div className="ctMarketLoading">Loading {label}…</div></div>;
}

const tickerConfig = {
  symbols: [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "FOREXCOM:NSXUSD", title: "NASDAQ 100" },
    { proName: "FOREXCOM:DJI", title: "Dow Jones" },
    { proName: "INDEX:RUT", title: "Russell 2000" },
    { proName: "INDEX:NI225", title: "Nikkei 225" },
    { proName: "INDEX:DEU40", title: "DAX" },
    { proName: "FX:EURUSD", title: "EUR/USD" },
    { proName: "TVC:GOLD", title: "Gold" },
    { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" }
  ],
  showSymbolLogo: true, colorTheme: "light", isTransparent: false, displayMode: "adaptive", locale: "en"
};

const overviewConfig = {
  colorTheme: "light", dateRange: "12M", showChart: true, locale: "en",
  isTransparent: false, showSymbolLogo: true, showFloatingTooltip: false,
  width: "100%", height: 560,
  tabs: [
    { title: "Indices", symbols: [
      { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
      { s: "NASDAQ:NDX", d: "NASDAQ 100" },
      { s: "FOREXCOM:DJI", d: "Dow Jones" },
      { s: "INDEX:RUT", d: "Russell 2000" },
      { s: "INDEX:NI225", d: "Nikkei 225" },
      { s: "INDEX:DEU40", d: "DAX" },
      { s: "TVC:UKX", d: "FTSE 100" }
    ]},
    { title: "Stocks", symbols: [
      { s: "NASDAQ:AAPL", d: "Apple" }, { s: "NASDAQ:MSFT", d: "Microsoft" },
      { s: "NASDAQ:NVDA", d: "NVIDIA" }, { s: "NASDAQ:AMZN", d: "Amazon" },
      { s: "NASDAQ:GOOGL", d: "Alphabet" }, { s: "NASDAQ:TSLA", d: "Tesla" }
    ]},
    { title: "Forex", symbols: [
      { s: "FX:EURUSD", d: "EUR/USD" }, { s: "FX:GBPUSD", d: "GBP/USD" },
      { s: "FX:USDJPY", d: "USD/JPY" }, { s: "FX:USDCAD", d: "USD/CAD" }
    ]},
    { title: "Commodities", symbols: [
      { s: "TVC:GOLD", d: "Gold" }, { s: "TVC:SILVER", d: "Silver" },
      { s: "TVC:USOIL", d: "WTI Crude Oil" }
    ]}
  ]
};

const moversConfig = { colorTheme: "light", dateRange: "1D", exchange: "US", showChart: false, locale: "en", width: "100%", height: 430, isTransparent: false, showSymbolLogo: true, showFloatingTooltip: true };

const newsConfig = {
  feedMode: "all_symbols", displayMode: "regular", colorTheme: "light",
  isTransparent: false, locale: "en", width: "100%", height: 620
};

export default function MarketDashboard() {
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [chartInterval, setChartInterval] = useState("D");
  const [message, setMessage] = useState("");
  const [watchInput, setWatchInput] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistStatus, setWatchlistStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [watchlistMessage, setWatchlistMessage] = useState("");
  const [analystData, setAnalystData] = useState<AnalystResearch | null>(null);
  const [analystStatus, setAnalystStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [analystMessage, setAnalystMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/markets/watchlist", { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 401) { if (active) setWatchlistStatus("signed-out"); return; }
          throw new Error(data.error || "Watchlist could not be loaded.");
        }
        if (active) {
          setWatchlist(Array.isArray(data.symbols) ? data.symbols : []);
          setWatchlistStatus("ready");
        }
      })
      .catch(error => {
        if (active) { setWatchlistStatus("error"); setWatchlistMessage(error instanceof Error ? error.message : "Watchlist could not be loaded."); }
      });
    return () => { active = false; };
  }, []);

  async function saveWatchlist(next: string[]) {
    setWatchlistMessage("");
    try {
      const response = await fetch("/api/markets/watchlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ symbols: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Watchlist could not be saved.");
      setWatchlist(Array.isArray(data.symbols) ? data.symbols : next);
      setWatchlistStatus("ready");
    } catch (error) {
      setWatchlistMessage(error instanceof Error ? error.message : "Watchlist could not be saved.");
    }
  }
  function addToWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = watchInput.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^(?:[A-Z0-9._-]{1,15}:)?[A-Z0-9._-]{1,15}$/.test(raw)) { setMessage("Enter a ticker such as AAPL or an exchange-qualified symbol such as NYSE:IBM."); return; }
    const next = raw.includes(":") ? raw : "NASDAQ:" + raw;
    if (!watchlist.includes(next)) saveWatchlist([...watchlist, next].slice(0, 30));
    setWatchInput(""); setMessage(""); setSymbol(next);
  }
  const selectedTicker = symbol.split(":").pop() || symbol;
  useEffect(() => {
    const controller = new AbortController();
    setAnalystStatus("loading");
    setAnalystMessage("");
    setAnalystData(null);
    fetch(`/api/markets/analyst?ticker=${encodeURIComponent(selectedTicker)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Analyst data is unavailable.");
        setAnalystData(data as AnalystResearch);
        setAnalystStatus("ready");
      })
      .catch(error => {
        if (controller.signal.aborted) return;
        setAnalystMessage(error instanceof Error ? error.message : "Analyst data is unavailable.");
        setAnalystStatus("error");
      });
    return () => controller.abort();
  }, [selectedTicker]);
  const analystUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(selectedTicker)}/analysis/`;
  const quoteUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(selectedTicker)}/`;
  function openSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = search.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^(?:[A-Z0-9._-]{1,15}:)?[A-Z0-9._-]{1,15}$/.test(raw)) {
      setMessage("Enter a ticker such as AAPL or an exchange-qualified symbol such as NYSE:IBM.");
      return;
    }
    setSymbol(raw.includes(":") ? raw : "NASDAQ:" + raw);
    setMessage("");
  }
  return <main className="ctMarketsPage">
    <header className="ctMarketsHeader"><Link href="/" className="ctMarketsBrand"><img src="/connect-logo.svg" alt="Connect" /> <span>Connect <small>Markets</small></span></Link><nav><Link href="/">Home</Link><Link href="/news">News</Link><Link href="/community">Community</Link><Link className="ctMarketsJoin" href="/register">Register Now</Link></nav></header>
    <section className="ctMarketsHero"><div><span className="ctMarketsEyebrow">CONNECT · FINANCIAL MARKETS</span><h1>Markets move.<br/><em>Stay in the know.</em></h1><p>Follow major market indexes, explore stocks and market movers, view company charts, and keep up with financial headlines from one place.</p><div className="ctMarketsTags"><span>Global indexes</span><span>Stocks & ETFs</span><span>Market news</span><span>Commodities & FX</span></div></div><div className="ctMarketsHeroArt" aria-hidden="true"><span>↗</span><b>MARKET<br/>WATCH</b><i>◒</i></div></section>
    <section className="ctMarketsTicker"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" config={tickerConfig} height={76} label="global market ticker" /></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>GLOBAL SNAPSHOT</span><h2>Market overview</h2><p>Major indexes, leading stocks, currencies and commodities.</p></div><small>Live or delayed by exchange and instrument</small></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js" config={overviewConfig} height={590} label="market overview" /></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>YOUR PERSONAL LIST</span><h2>My stock watchlist</h2><p>Save up to 30 ticker symbols to your Connect member account and access them across devices.</p></div><small>Account-synced</small></div>{watchlistStatus==="loading" ? <p className="ctMarketLoading">Loading your saved watchlist…</p> : watchlistStatus==="signed-out" ? <p className="ctMarketLoading">Sign in to Connect to save a personal watchlist that follows your account.</p> : watchlistStatus==="error" ? <p className="ctMarketsMessage" role="alert">{watchlistMessage || "Your account watchlist is unavailable."}</p> : <><form className="ctMarketsSearch" onSubmit={addToWatchlist}><label htmlFor="watchlist-symbol">Add ticker</label><input id="watchlist-symbol" value={watchInput} onChange={e=>setWatchInput(e.target.value)} placeholder="e.g. TSLA, AMZN, NYSE:IBM" maxLength={31}/><button type="submit">＋ Add to watchlist</button></form><div className="ctMarketsWatchlist">{watchlist.length ? watchlist.map(item=><div className={symbol===item?"ctMarketsWatchItem active":"ctMarketsWatchItem"} key={item}><button type="button" onClick={()=>setSymbol(item)}>{item}</button><button type="button" aria-label={"Remove "+item} onClick={()=>void saveWatchlist(watchlist.filter(value=>value!==item))}>×</button></div>) : <p>Your watchlist is empty. Add a ticker above to get started.</p>}</div>{watchlistMessage && <p className="ctMarketsMessage" role="alert">{watchlistMessage}</p>}</>}</section><section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>EXPLORE A COMPANY</span><h2>Stock details & chart</h2><p>Choose a popular stock or enter any supported exchange:ticker symbol. All detail panels below follow your selected stock.</p></div><small>Quotes may be delayed by exchange</small></div><div className="ctMarketsQuickPick" aria-label="Popular stocks">{[["NASDAQ:AAPL","Apple"],["NASDAQ:MSFT","Microsoft"],["NASDAQ:NVDA","NVIDIA"],["NASDAQ:AMZN","Amazon"],["NASDAQ:GOOGL","Alphabet"],["NASDAQ:TSLA","Tesla"],["NASDAQ:META","Meta"],["NYSE:JPM","JPMorgan"],["NYSE:WMT","Walmart"],["NYSE:IBM","IBM"]].map(([ticker,name])=><button type="button" key={ticker} className={symbol===ticker?"active":""} onClick={()=>{setSymbol(ticker);setSearch(ticker);setMessage("");}}>{name}<small>{ticker.split(":")[1]}</small></button>)}</div><form className="ctMarketsSearch" onSubmit={openSymbol}><label htmlFor="market-symbol">Ticker / exchange</label><input id="market-symbol" value={search} onChange={e=>setSearch(e.target.value)} placeholder="AAPL or NYSE:IBM" maxLength={30}/><button type="submit">Load stock data ↗</button></form>{message&&<p className="ctMarketsMessage" role="alert">{message}</p>}<div className="ctStockDataGrid"><div className="ctMarketsPanel"><h3>Price, quote & key metrics</h3><TradingViewEmbed key={"quote-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js" config={{symbol,width:"100%",locale:"en",colorTheme:"light",isTransparent:false}} height={190} label={symbol+" price and quote details"}/></div><div className="ctMarketsPanel"><h3>Technical analysis</h3><TradingViewEmbed key={"technical-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" config={{symbol,interval:"1D",width:"100%",isTransparent:false,colorTheme:"light",locale:"en"}} height={420} label={symbol+" technical analysis"}/></div></div><div className="ctMarketsPanel ctStockProfile"><h3>Company profile</h3><TradingViewEmbed key={"profile-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js" config={{symbol,width:"100%",height:"100%",colorTheme:"light",isTransparent:false,locale:"en"}} height={250} label={symbol+" company profile"}/></div><div className="ctMarketsPanel ctStockFinancials"><h3>Financial statements & fundamentals</h3><TradingViewEmbed key={"financials-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-financials.js" config={{symbol,width:"100%",height:"100%",colorTheme:"light",isTransparent:false,displayMode:"adaptive",locale:"en"}} height={520} label={symbol+" financial statements and fundamentals"}/></div><div className="ctMarketsPanel ctStockHistory"><div className="ctStockPanelHead"><div><h3>Interactive price history</h3><p>Explore historical price movement and volume for {selectedTicker}.</p></div><div className="ctHistoryRanges" aria-label="Chart candle interval">{[["1m","1"],["5m","5"],["15m","15"],["1h","60"],["1D","D"],["1W","W"],["1M","M"]].map(([label,interval])=><button type="button" key={label} className={chartInterval===interval?"active":""} onClick={()=>setChartInterval(interval)}>{label}</button>)}</div></div><TradingViewEmbed key={"chart-"+symbol+"-"+chartInterval} src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" config={{autosize:true,symbol,interval:chartInterval,timezone:"America/New_York",theme:"light",style:"1",locale:"en",allow_symbol_change:true,withdateranges:true,calendar:false,support_host:"https://www.tradingview.com"}} height={570} label={symbol+" interactive price history chart"}/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>DAILY MARKET MOVERS</span><h2>Top gainers, losers & active stocks</h2><p>See which U.S. stocks are moving most during the current market session.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js" config={moversConfig} height={450} label="top gaining, losing and active stocks"/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>MARKET MOMENTUM</span><h2>Stock market heatmap</h2><p>Compare company performance by sector and market capitalization.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js" config={{dataSource:"SPX500",blockSize:"market_cap_basic",blockColor:"change",grouping:"sector",locale:"en",symbolUrl:"",colorTheme:"light",exchanges:[],hasTopBar:false,isDataSetEnabled:false,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false,width:"100%",height:"100%"}} height={540} label="stock market heatmap"/></div></section>
    <section className="ctMarketsSection ctSelectedStockNews"><div className="ctMarketsSectionHead"><div><span>NEWS FOR THE SELECTED STOCK</span><h2>{selectedTicker} news & company updates</h2><p>Headlines and market stories related to {selectedTicker}. This feed changes when you select another stock.</p></div><small>TradingView news feed</small></div><div className="ctMarketsPanel"><TradingViewEmbed key={"news-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" config={{feedMode:"symbol",symbol,displayMode:"regular",colorTheme:"light",isTransparent:false,locale:"en",width:"100%",height:650}} height={670} label={selectedTicker+" stock-specific financial news"}/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>WALL STREET VIEW</span><h2>{selectedTicker} analyst coverage & recommendations</h2><p>Review analyst consensus, rating changes, earnings estimates and price targets from an external financial-data provider.</p></div></div><div className="ctAnalystLivePanel">
      {analystStatus === "loading" ? <p className="ctMarketLoading">Loading analyst consensus and recent rating changes for {selectedTicker}…</p> : analystStatus === "error" ? <div className="ctAnalystUnavailable" role="status"><strong>Live analyst figures are not available</strong><p>{analystMessage}</p><a href={analystUrl} target="_blank" rel="noopener noreferrer">View external analyst research ↗</a></div> : analystData ? <>
        <div className="ctAnalystDataMeta"><span>{analystData.source}</span><small>Data retrieved {new Date(analystData.fetchedAt).toLocaleString()}</small></div>
        {analystData.consensus ? <><div className="ctAnalystSummary">
          <article><span>CONSENSUS VIEW</span><strong>{(analystData.consensus.consensus_rating || "Not rated").replaceAll("_"," ").toUpperCase()}</strong><small>{analystData.consensus.ratings_contributors ?? "—"} contributing analysts</small></article>
          <article><span>AVERAGE PRICE TARGET</span><strong>{typeof analystData.consensus.consensus_price_target === "number" ? new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(analystData.consensus.consensus_price_target) : "Not available"}</strong><small>{analystData.consensus.price_target_contributors ?? 0} target contributors</small></article>
          <article><span>PRICE TARGET RANGE</span><strong>{typeof analystData.consensus.low_price_target === "number" && typeof analystData.consensus.high_price_target === "number" ? new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(analystData.consensus.low_price_target)+" – "+new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(analystData.consensus.high_price_target) : "Not available"}</strong><small>Low to high published target</small></article>
        </div><div className="ctAnalystDistribution" aria-label="Analyst recommendation distribution">
          {([["Strong buy",analystData.consensus.strong_buy_ratings],["Buy",analystData.consensus.buy_ratings],["Hold",analystData.consensus.hold_ratings],["Sell",analystData.consensus.sell_ratings],["Strong sell",analystData.consensus.strong_sell_ratings]] as [string,number|undefined][]).map(([label,value])=><div key={label}><span>{label}</span><strong>{value ?? 0}</strong></div>)}
        </div></> : <p className="ctAnalystNoData">No analyst consensus is currently published for {selectedTicker}.</p>}
        <div className="ctAnalystChanges"><h3>Recent analyst rating & target changes</h3>{analystData.ratings.length ? analystData.ratings.map((item,index)=><article key={item.date+"-"+item.firm+"-"+index}><div><strong>{item.firm || item.analyst || "Research firm"}</strong><small>{item.date ? new Date(item.date).toLocaleDateString() : "Date unavailable"}</small></div><p>{item.ratingAction ? item.ratingAction.replaceAll("_"," ") : "Rating update"}{item.previousRating && item.rating ? ": "+item.previousRating+" → "+item.rating : item.rating ? ": "+item.rating : ""}</p>{typeof item.priceTarget === "number" && <small>Target {item.priceTargetAction || "set"}: {new Intl.NumberFormat("en-US",{style:"currency",currency:item.currency || "USD"}).format(item.priceTarget)}{typeof item.previousPriceTarget === "number" ? " (previously "+new Intl.NumberFormat("en-US",{style:"currency",currency:item.currency || "USD"}).format(item.previousPriceTarget)+")" : ""}</small>}</article>) : <p className="ctAnalystNoData">No recent rating changes found for this ticker.</p>}</div>
      </> : null}
    </div><div className="ctAnalystCoverage"><article><span>EXTERNAL ANALYST RESEARCH</span><h3>More coverage & estimates</h3><p>Open additional analyst research, earnings estimates and coverage details for {selectedTicker}.</p><a href={analystUrl} target="_blank" rel="noopener noreferrer">View {selectedTicker} analyst coverage on Yahoo Finance ↗</a></article><article><span>COMPANY QUOTE & HISTORY</span><h3>Price, performance & company details</h3><p>Check the latest displayed quote, historical performance, key statistics and company information for {selectedTicker}.</p><a href={quoteUrl} target="_blank" rel="noopener noreferrer">Open {selectedTicker} quote on Yahoo Finance ↗</a></article></div><p className="ctAnalystNote">Analyst opinions are third-party research, not guarantees or Connect recommendations. Consensus is an aggregation of published third-party ratings, not advice from Connect. Data availability and update frequency depend on provider coverage and subscription.</p></section>
    <aside className="ctMarketsDisclaimer"><strong>Market information notice</strong><p>Financial data is supplied by TradingView and its data providers. Availability, pricing delay, exchange coverage and market status vary by instrument and region. Connect does not execute trades, provide personalized investment advice, or guarantee data accuracy. Information is for general educational purposes only. Always verify details with an authorized financial data provider before making decisions.</p><small>Widgets retain TradingView branding and attribution. <a href="https://www.tradingview.com/widget/" target="_blank" rel="noopener noreferrer">About TradingView widgets ↗</a></small></aside>
    <footer className="ctMarketsFooter"><Link href="/">Connect</Link><span>© {new Date().getFullYear()} Techcyber LLC</span><div><Link href="/news">News</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></div></footer>
  </main>;
}
