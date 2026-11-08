"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type WidgetProps = { src: string; config: Record<string, unknown>; height: number; label: string };
function TradingViewEmbed({ src, config, height, label }: WidgetProps) {
  const host = useRef<HTMLDivElement>(null);
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
  const [message, setMessage] = useState("");
  function openSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = search.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9._-]{1,15}$/.test(raw)) {
      setMessage("Enter a valid ticker symbol, such as AAPL, MSFT, or NVDA.");
      return;
    }
    setSymbol(raw.includes(":") ? raw : "NASDAQ:" + raw);
    setMessage("");
  }
  return <main className="ctMarketsPage">
    <header className="ctMarketsHeader"><a href="/" className="ctMarketsBrand"><img src="/connect-logo.svg" alt="Connect" /> <span>Connect <small>Markets</small></span></a><nav><a href="/">Home</a><a href="/news">News</a><a href="/community">Community</a><a className="ctMarketsJoin" href="/register">Register Now</a></nav></header>
    <section className="ctMarketsHero"><div><span className="ctMarketsEyebrow">CONNECT · FINANCIAL MARKETS</span><h1>Markets move.<br/><em>Stay in the know.</em></h1><p>Follow major market indexes, explore stocks and market movers, view company charts, and keep up with financial headlines from one place.</p><div className="ctMarketsTags"><span>Global indexes</span><span>Stocks & ETFs</span><span>Market news</span><span>Commodities & FX</span></div></div><div className="ctMarketsHeroArt" aria-hidden="true"><span>↗</span><b>MARKET<br/>WATCH</b><i>◒</i></div></section>
    <section className="ctMarketsTicker"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" config={tickerConfig} height={76} label="global market ticker" /></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>GLOBAL SNAPSHOT</span><h2>Market overview</h2><p>Major indexes, leading stocks, currencies and commodities.</p></div><small>Live or delayed by exchange and instrument</small></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js" config={overviewConfig} height={590} label="market overview" /></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>EXPLORE A COMPANY</span><h2>Stock chart</h2><p>Enter a ticker symbol to open its interactive chart.</p></div></div><form className="ctMarketsSearch" onSubmit={openSymbol}><label htmlFor="market-symbol">Ticker symbol</label><input id="market-symbol" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try AAPL, MSFT, NVDA…" maxLength={15}/><button type="submit">View chart ↗</button></form>{message&&<p className="ctMarketsMessage" role="alert">{message}</p>}<div className="ctMarketsPanel"><TradingViewEmbed key={symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" config={{autosize:true,symbol,interval:"D",timezone:"America/New_York",theme:"light",style:"1",locale:"en",allow_symbol_change:true,calendar:false,support_host:"https://www.tradingview.com"}} height={570} label={symbol+" interactive chart"}/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>DAILY MARKET MOVERS</span><h2>Top gainers, losers & active stocks</h2><p>See which U.S. stocks are moving most during the current market session.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js" config={moversConfig} height={450} label="top gaining, losing and active stocks"/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>MARKET MOMENTUM</span><h2>Stock market heatmap</h2><p>Compare company performance by sector and market capitalization.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js" config={{dataSource:"SPX500",blockSize:"market_cap_basic",blockColor:"change",grouping:"sector",locale:"en",symbolUrl:"",colorTheme:"light",exchanges:[],hasTopBar:false,isDataSetEnabled:false,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false,width:"100%",height:"100%"}} height={540} label="stock market heatmap"/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>FINANCIAL HEADLINES</span><h2>Market news feed</h2><p>Market-related stories and updates from TradingView. Select a headline to continue to its source.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" config={newsConfig} height={650} label="financial news feed"/></div></section>
    <aside className="ctMarketsDisclaimer"><strong>Market information notice</strong><p>Financial data is supplied by TradingView and its data providers. Availability, pricing delay, exchange coverage and market status vary by instrument and region. Connect does not execute trades, provide personalized investment advice, or guarantee data accuracy. Information is for general educational purposes only. Always verify details with an authorized financial data provider before making decisions.</p><small>Widgets retain TradingView branding and attribution. <a href="https://www.tradingview.com/widget/" target="_blank" rel="noopener noreferrer">About TradingView widgets ↗</a></small></aside>
    <footer className="ctMarketsFooter"><a href="/">Connect</a><span>© {new Date().getFullYear()} Techcyber LLC</span><div><a href="/news">News</a><a href="/legal/terms">Terms</a><a href="/legal/privacy">Privacy</a></div></footer>
  </main>;
}
