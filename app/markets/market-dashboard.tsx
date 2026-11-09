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


type MarketCountry = { code: string; name: string; exchange: string; primaryIndex: string; heatmap: string; indices: Array<{s:string;d:string}>; stocks: Array<[string,string]>; tickerSymbols: Array<{proName:string;title:string}> };
const marketCountries: MarketCountry[] = [
  {code:"US",name:"United States",exchange:"US",primaryIndex:"FOREXCOM:SPXUSD",heatmap:"SPX500",indices:[{s:"FOREXCOM:SPXUSD",d:"S&P 500"},{s:"NASDAQ:NDX",d:"NASDAQ 100"},{s:"FOREXCOM:DJI",d:"Dow Jones"},{s:"INDEX:RUT",d:"Russell 2000"}],stocks:[["NASDAQ:AAPL","Apple"],["NASDAQ:MSFT","Microsoft"],["NASDAQ:NVDA","NVIDIA"],["NASDAQ:AMZN","Amazon"],["NASDAQ:GOOGL","Alphabet"],["NASDAQ:TSLA","Tesla"],["NYSE:JPM","JPMorgan"]],tickerSymbols:[{proName:"FOREXCOM:SPXUSD",title:"S&P 500"},{proName:"NASDAQ:NDX",title:"NASDAQ 100"},{proName:"FOREXCOM:DJI",title:"Dow Jones"},{proName:"INDEX:RUT",title:"Russell 2000"}]},
  {code:"GB",name:"United Kingdom",exchange:"GB",primaryIndex:"TVC:UKX",heatmap:"FTSE100",indices:[{s:"TVC:UKX",d:"FTSE 100"},{s:"TVC:UKX",d:"FTSE All-Share"}],stocks:[["LSE:HSBA","HSBC"],["LSE:AZN","AstraZeneca"],["LSE:SHEL","Shell"],["LSE:BP.","BP"],["LSE:ULVR","Unilever"]],tickerSymbols:[{proName:"TVC:UKX",title:"FTSE 100"},{proName:"LSE:HSBA",title:"HSBC"},{proName:"LSE:AZN",title:"AstraZeneca"},{proName:"LSE:SHEL",title:"Shell"}]},
  {code:"DE",name:"Germany",exchange:"DE",primaryIndex:"XETR:DAX",heatmap:"DAX",indices:[{s:"XETR:DAX",d:"DAX"},{s:"XETR:MDAX",d:"MDAX"}],stocks:[["XETR:SAP","SAP"],["XETR:ALV","Allianz"],["XETR:SIE","Siemens"],["XETR:BMW","BMW"]],tickerSymbols:[{proName:"XETR:DAX",title:"DAX"},{proName:"XETR:SAP",title:"SAP"},{proName:"XETR:ALV",title:"Allianz"}]},
  {code:"FR",name:"France",exchange:"FR",primaryIndex:"EURONEXT:PX1",heatmap:"CAC40",indices:[{s:"EURONEXT:PX1",d:"CAC 40"}],stocks:[["EURONEXT:OR","L'Oréal"],["EURONEXT:MC","LVMH"],["EURONEXT:SAN","Sanofi"],["EURONEXT:AI","Air Liquide"]],tickerSymbols:[{proName:"EURONEXT:PX1",title:"CAC 40"},{proName:"EURONEXT:MC",title:"LVMH"},{proName:"EURONEXT:OR",title:"L'Oréal"}]},
  {code:"JP",name:"Japan",exchange:"JP",primaryIndex:"INDEX:NKY",heatmap:"NIKKEI225",indices:[{s:"INDEX:NKY",d:"Nikkei 225"},{s:"TSE:TOPIX",d:"TOPIX"}],stocks:[["TSE:7203","Toyota"],["TSE:6758","Sony"],["TSE:9984","SoftBank"],["TSE:6861","Keyence"]],tickerSymbols:[{proName:"INDEX:NKY",title:"Nikkei 225"},{proName:"TSE:7203",title:"Toyota"},{proName:"TSE:6758",title:"Sony"}]},
  {code:"IN",name:"India",exchange:"IN",primaryIndex:"BSE:SENSEX",heatmap:"SENSEX",indices:[{s:"BSE:SENSEX",d:"BSE Sensex"},{s:"NSE:NIFTY",d:"Nifty 50"}],stocks:[["NSE:RELIANCE","Reliance"],["NSE:TCS","TCS"],["NSE:HDFCBANK","HDFC Bank"],["NSE:INFY","Infosys"]],tickerSymbols:[{proName:"BSE:SENSEX",title:"Sensex"},{proName:"NSE:NIFTY",title:"Nifty 50"},{proName:"NSE:RELIANCE",title:"Reliance"}]},
  {code:"CA",name:"Canada",exchange:"CA",primaryIndex:"TSX:TSX",heatmap:"TSX",indices:[{s:"TSX:TSX",d:"S&P/TSX Composite"}],stocks:[["TSX:RY","Royal Bank"],["TSX:SHOP","Shopify"],["TSX:TD","TD Bank"],["TSX:ENB","Enbridge"]],tickerSymbols:[{proName:"TSX:TSX",title:"S&P/TSX"},{proName:"TSX:RY",title:"Royal Bank"},{proName:"TSX:SHOP",title:"Shopify"}]},
  {code:"AU",name:"Australia",exchange:"AU",primaryIndex:"ASX:XJO",heatmap:"ASX200",indices:[{s:"ASX:XJO",d:"S&P/ASX 200"}],stocks:[["ASX:BHP","BHP"],["ASX:CBA","Commonwealth Bank"],["ASX:CSL","CSL"],["ASX:WBC","Westpac"]],tickerSymbols:[{proName:"ASX:XJO",title:"ASX 200"},{proName:"ASX:BHP",title:"BHP"},{proName:"ASX:CBA",title:"Commonwealth Bank"}]},
  {code:"HK",name:"Hong Kong",exchange:"HK",primaryIndex:"HSI:HSI",heatmap:"HSI",indices:[{s:"HSI:HSI",d:"Hang Seng Index"}],stocks:[["HKEX:700","Tencent"],["HKEX:9988","Alibaba"],["HKEX:1299","AIA"]],tickerSymbols:[{proName:"HSI:HSI",title:"Hang Seng"},{proName:"HKEX:700",title:"Tencent"},{proName:"HKEX:9988",title:"Alibaba"}]},
  {code:"SG",name:"Singapore",exchange:"SG",primaryIndex:"SGX:STI",heatmap:"STI",indices:[{s:"SGX:STI",d:"Straits Times Index"}],stocks:[["SGX:D05","DBS"],["SGX:O39","OCBC"],["SGX:U11","UOB"]],tickerSymbols:[{proName:"SGX:STI",title:"Straits Times"},{proName:"SGX:D05",title:"DBS"}]},
  {code:"BR",name:"Brazil",exchange:"BR",primaryIndex:"BMFBOVESPA:IBOV",heatmap:"IBOV",indices:[{s:"BMFBOVESPA:IBOV",d:"Bovespa"}],stocks:[["BMFBOVESPA:PETR4","Petrobras"],["BMFBOVESPA:VALE3","Vale"],["BMFBOVESPA:ITUB4","Itaú"]],tickerSymbols:[{proName:"BMFBOVESPA:IBOV",title:"Bovespa"},{proName:"BMFBOVESPA:PETR4",title:"Petrobras"}]}
];
const languageOptions = [{code:"en",label:"English"},{code:"es",label:"Español"},{code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"pt",label:"Português"},{code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"zh_CN",label:"简体中文"},{code:"ar",label:"العربية"}];
type MarketCopyEntry = {
  home:string;news:string;community:string;register:string;hero:string;hero2:string;intro:string;
  overview:string;watchlist:string;accounts:string;stock:string;movers:string;heatmap:string;
  regionalNews:string;language:string;country:string;search:string;load:string;add:string;
  tags:string[];accountIntro:string;
};
const marketCopy: Record<string,MarketCopyEntry> = {
  en:{home:"Home",news:"News",community:"Community",register:"Register Now",hero:"Markets move.",hero2:"Stay in the know.",intro:"Follow local indexes, explore stocks and market movers, view company charts, and keep up with financial headlines.",overview:"Market overview",watchlist:"My stock watchlist",accounts:"Investment applications",stock:"Stock details & chart",movers:"Top gainers, losers & active stocks",heatmap:"Market heatmap",regionalNews:"Regional market news",language:"Language",country:"Market country",search:"Ticker / exchange",load:"Load stock data",add:"Add to watchlist",tags:["Global indexes","Stocks & ETFs","Market news","Commodities & FX"],accountIntro:"Open official brokerage, investing, crypto and wealth-management websites available in your market."},
  es:{home:"Inicio",news:"Noticias",community:"Comunidad",register:"Registrarse",hero:"Los mercados se mueven.",hero2:"Mantente informado.",intro:"Sigue índices locales, explora acciones y movimientos del mercado y consulta noticias financieras.",overview:"Resumen del mercado",watchlist:"Mi lista de seguimiento",accounts:"Aplicaciones de inversión",stock:"Detalles y gráfico",movers:"Mayores subidas, bajadas y actividad",heatmap:"Mapa del mercado",regionalNews:"Noticias del mercado local",language:"Idioma",country:"País del mercado",search:"Símbolo / bolsa",load:"Cargar datos",add:"Añadir a la lista",tags:["Índices globales","Acciones y ETF","Noticias del mercado","Materias primas y divisas"],accountIntro:"Abre sitios oficiales de inversión, criptomonedas y gestión patrimonial disponibles en tu mercado."},
  fr:{home:"Accueil",news:"Actualités",community:"Communauté",register:"S’inscrire",hero:"Les marchés évoluent.",hero2:"Restez informé.",intro:"Suivez les indices locaux, les actions, les tendances et les actualités financières.",overview:"Vue d’ensemble du marché",watchlist:"Ma liste de suivi",accounts:"Applications d’investissement",stock:"Détails et graphique",movers:"Plus fortes hausses, baisses et activités",heatmap:"Carte du marché",regionalNews:"Actualités du marché local",language:"Langue",country:"Pays du marché",search:"Symbole / marché",load:"Charger les données",add:"Ajouter à la liste",tags:["Indices mondiaux","Actions et ETF","Actualités des marchés","Matières premières et devises"],accountIntro:"Accédez aux sites officiels de courtage, d’investissement et de crypto disponibles dans votre marché."},
  de:{home:"Startseite",news:"Nachrichten",community:"Community",register:"Registrieren",hero:"Märkte bewegen sich.",hero2:"Bleiben Sie informiert.",intro:"Verfolgen Sie lokale Indizes, Aktien, Marktbewegungen und Finanznachrichten.",overview:"Marktübersicht",watchlist:"Meine Beobachtungsliste",accounts:"Investment-Apps",stock:"Aktieninfos & Chart",movers:"Gewinner, Verlierer & meistgehandelt",heatmap:"Markt-Heatmap",regionalNews:"Regionale Marktnachrichten",language:"Sprache",country:"Marktland",search:"Ticker / Börse",load:"Kursdaten laden",add:"Zur Liste hinzufügen",tags:["Globale Indizes","Aktien & ETFs","Marktnachrichten","Rohstoffe & Devisen"],accountIntro:"Öffnen Sie offizielle Broker-, Investment- und Krypto-Websites für Ihren Markt."},
  pt:{home:"Início",news:"Notícias",community:"Comunidade",register:"Registar",hero:"Os mercados mudam.",hero2:"Fique informado.",intro:"Acompanhe índices locais, ações, movimentos do mercado e notícias financeiras.",overview:"Visão geral do mercado",watchlist:"Minha lista",accounts:"Aplicativos de investimento",stock:"Detalhes e gráfico",movers:"Maiores altas, baixas e volume",heatmap:"Mapa de mercado",regionalNews:"Notícias do mercado regional",language:"Idioma",country:"País do mercado",search:"Código / bolsa",load:"Carregar dados",add:"Adicionar à lista",tags:["Índices globais","Ações e ETFs","Notícias do mercado","Commodities e câmbio"],accountIntro:"Acesse sites oficiais de corretoras, investimentos e cripto disponíveis no seu mercado."},
  ja:{home:"ホーム",news:"ニュース",community:"コミュニティ",register:"登録",hero:"市場は動く。",hero2:"最新情報をチェック。",intro:"各国の指数、株式、市場動向、金融ニュースを確認できます。",overview:"マーケット概要",watchlist:"ウォッチリスト",accounts:"投資アプリ",stock:"銘柄詳細とチャート",movers:"上昇・下落・売買活発銘柄",heatmap:"マーケットヒートマップ",regionalNews:"地域市場ニュース",language:"言語",country:"市場の国",search:"銘柄 / 取引所",load:"データを表示",add:"リストに追加",tags:["世界の指数","株式・ETF","マーケットニュース","商品・為替"],accountIntro:"お住まいの市場で利用できる公式の証券・投資・暗号資産サービスを開きます。"},
  ko:{home:"홈",news:"뉴스",community:"커뮤니티",register:"가입하기",hero:"시장은 움직입니다.",hero2:"최신 정보를 확인하세요.",intro:"각국 지수, 주식, 시장 동향 및 금융 뉴스를 확인하세요.",overview:"시장 개요",watchlist:"관심 종목",accounts:"투자 앱",stock:"종목 정보 및 차트",movers:"상승·하락·거래량 상위",heatmap:"시장 히트맵",regionalNews:"지역 시장 뉴스",language:"언어",country:"시장 국가",search:"종목 / 거래소",load:"데이터 불러오기",add:"관심 목록에 추가",tags:["글로벌 지수","주식 및 ETF","시장 뉴스","원자재 및 외환"],accountIntro:"해당 시장에서 이용 가능한 공식 증권·투자·암호화폐 사이트를 엽니다."},
  zh_CN:{home:"首页",news:"新闻",community:"社区",register:"立即注册",hero:"市场瞬息万变。",hero2:"掌握最新动态。",intro:"关注本地指数、股票、市场走势和财经新闻。",overview:"市场概览",watchlist:"我的自选列表",accounts:"投资应用",stock:"股票详情与图表",movers:"涨幅榜、跌幅榜及活跃股票",heatmap:"市场热力图",regionalNews:"地区市场新闻",language:"语言",country:"市场国家",search:"代码 / 交易所",load:"加载行情",add:"加入自选",tags:["全球指数","股票与 ETF","市场新闻","大宗商品与外汇"],accountIntro:"打开您所在市场可用的官方券商、投资及加密资产平台。"},
  ar:{home:"الرئيسية",news:"الأخبار",community:"المجتمع",register:"سجّل الآن",hero:"الأسواق تتحرك.",hero2:"ابقَ على اطلاع.",intro:"تابع المؤشرات المحلية والأسهم وحركة السوق والأخبار المالية.",overview:"نظرة عامة على السوق",watchlist:"قائمة المتابعة",accounts:"تطبيقات الاستثمار",stock:"تفاصيل السهم والرسم البياني",movers:"الأكثر ارتفاعاً وانخفاضاً ونشاطاً",heatmap:"خريطة السوق",regionalNews:"أخبار السوق الإقليمية",language:"اللغة",country:"دولة السوق",search:"رمز / بورصة",load:"تحميل البيانات",add:"إضافة إلى القائمة",tags:["المؤشرات العالمية","الأسهم والصناديق","أخبار السوق","السلع والعملات"],accountIntro:"افتح المواقع الرسمية للوساطة والاستثمار والعملات الرقمية المتاحة في سوقك."}
};

const investmentAccounts = [
  { name: "E*TRADE", type: "Brokerage & retirement", mark: "E*", url: "https://us.etrade.com/etx/pxy/login" , countries:["US"]},
  { name: "Charles Schwab", type: "Brokerage & wealth management", mark: "CS", url: "https://www.schwab.com/" , countries:["US"]},
  { name: "Binance.US", type: "Crypto exchange · US state availability varies", mark: "B", url: "https://www.binance.us/", countries:["US"]},
  { name: "Coinbase", type: "Crypto exchange", mark: "CB", url: "https://www.coinbase.com/signin" , countries:["US","GB","CA","AU","SG"]},
  { name: "Robinhood", type: "Stocks, options & crypto", mark: "RH", url: "https://robinhood.com/" , countries:["US","GB"]},
  { name: "Fidelity", type: "Brokerage & retirement", mark: "F", url: "https://www.fidelity.com/" , countries:["US","GB","CA"]},
  { name: "Vanguard", type: "Investing & retirement", mark: "V", url: "https://investor.vanguard.com/" , countries:["US","GB","AU"]},
  { name: "Merrill Edge", type: "Self-directed investing", mark: "ME", url: "https://www.merrilledge.com/" , countries:["US"]},
  { name: "Interactive Brokers", type: "Global brokerage", mark: "IB", url: "https://www.interactivebrokers.com/" , countries:["*"]},
  { name: "Webull", type: "Stocks, ETFs & options", mark: "W", url: "https://www.webull.com/" , countries:["US","HK","SG"]},
  { name: "SoFi Invest", type: "Investing & financial services", mark: "S", url: "https://www.sofi.com/invest/" , countries:["US"]},
  { name: "Wealthfront", type: "Automated investing", mark: "WF", url: "https://www.wealthfront.com/" , countries:["US"]},
  { name: "Betterment", type: "Automated investing", mark: "B", url: "https://www.betterment.com/" , countries:["US"]},
  { name: "Morgan Stanley", type: "Wealth management", mark: "MS", url: "https://www.morganstanley.com/" , countries:["US","GB","DE","FR","JP","SG"]},
  { name: "J.P. Morgan", type: "Self-directed & managed investing", mark: "JP", url: "https://www.jpmorgan.com/wealth-management" , countries:["US","GB","DE","FR","JP","CA"]},
  { name: "Kraken", type: "Crypto exchange", mark: "K", url: "https://www.kraken.com/sign-in" , countries:["US","GB","DE","FR","JP","IN","CA","AU","HK","SG","BR"]},
  { name: "Tastytrade", type: "Options & futures brokerage", mark: "T", url: "https://tastytrade.com/" , countries:["US"]},

  { name: "Hargreaves Lansdown", type: "UK investment platform", mark: "HL", url: "https://www.hl.co.uk/", countries: ["GB"] },
  { name: "Trading 212", type: "Stocks, ETFs & ISA", mark: "212", url: "https://www.trading212.com/", countries: ["GB","DE","FR"] },
  { name: "AJ Bell", type: "UK investing & pensions", mark: "AJ", url: "https://www.ajbell.co.uk/", countries: ["GB"] },
  { name: "DEGIRO", type: "European brokerage", mark: "D", url: "https://www.degiro.com/", countries: ["DE","FR"] },
  { name: "Trade Republic", type: "German investment app", mark: "TR", url: "https://traderepublic.com/", countries: ["DE","FR"] },
  { name: "Boursorama", type: "French banking & investing", mark: "BO", url: "https://www.boursobank.com/", countries: ["FR"] },
  { name: "Saxo", type: "Multi-market investment platform", mark: "S", url: "https://www.home.saxo/", countries: ["GB","DE","FR","JP","SG","AU"] },
  { name: "Zerodha", type: "Indian stock brokerage", mark: "Z", url: "https://zerodha.com/", countries: ["IN"] },
  { name: "Groww", type: "Indian investing platform", mark: "G", url: "https://groww.in/", countries: ["IN"] },
  { name: "Upstox", type: "Indian stock brokerage", mark: "U", url: "https://upstox.com/", countries: ["IN"] },
  { name: "Questrade", type: "Canadian brokerage", mark: "Q", url: "https://www.questrade.com/", countries: ["CA"] },
  { name: "Wealthsimple", type: "Canadian investing platform", mark: "WS", url: "https://www.wealthsimple.com/", countries: ["CA"] },
  { name: "CommSec", type: "Australian brokerage", mark: "C", url: "https://www.commsec.com.au/", countries: ["AU"] },
  { name: "Stake", type: "Australian & global investing", mark: "ST", url: "https://hellostake.com/", countries: ["AU"] },
  { name: "Rakuten Securities", type: "Japanese online brokerage", mark: "R", url: "https://www.rakuten-sec.co.jp/", countries: ["JP"] },
  { name: "SBI Securities", type: "Japanese brokerage", mark: "SBI", url: "https://www.sbisec.co.jp/", countries: ["JP"] },
  { name: "Futu / moomoo", type: "Hong Kong & global investing", mark: "M", url: "https://www.moomoo.com/", countries: ["HK","SG","AU"] },
  { name: "Tiger Brokers", type: "Multi-market brokerage", mark: "T", url: "https://www.itiger.com/", countries: ["HK","SG","AU"] },
  { name: "XP Investimentos", type: "Brazilian investment platform", mark: "XP", url: "https://www.xpi.com.br/", countries: ["BR"] },
  { name: "eToro", type: "Multi-country investing platform", mark: "e", url: "https://www.etoro.com/", countries: ["GB","DE","FR","JP","IN","CA","AU","HK","SG","BR"] },
];

export default function MarketDashboard() {
  const [countryCode, setCountryCode] = useState("US");
  const [language, setLanguage] = useState("en");
  const selectedCountry = marketCountries.find(item => item.code === countryCode) || marketCountries[0];
  const copy = marketCopy[language] || marketCopy.en;
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

  useEffect(() => { const activeCountry = marketCountries.find(item => item.code === countryCode) || marketCountries[0]; const first = activeCountry.stocks[0]?.[0] || "NASDAQ:AAPL"; setSymbol(first); setSearch(first); setMessage(""); }, [countryCode]);

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
  return <main className="ctMarketsPage" dir={language === "ar" ? "rtl" : "ltr"}>
    <header className="ctMarketsHeader"><Link href="/" className="ctMarketsBrand"><img src="/connect-logo.svg" alt="Connect" /> <span>Connect <small>Markets</small></span></Link><div className="ctMarketsLocale"><label>{copy.country}<select aria-label={copy.country} value={countryCode} onChange={event=>setCountryCode(event.target.value)}>{marketCountries.map(item=><option value={item.code} key={item.code}>{item.name}</option>)}</select></label><label>{copy.language}<select aria-label={copy.language} value={language} onChange={event=>setLanguage(event.target.value)}>{languageOptions.map(item=><option value={item.code} key={item.code}>{item.label}</option>)}</select></label></div><nav><Link href="/">{copy.home}</Link><Link href="/news">{copy.news}</Link><Link href="/community">{copy.community}</Link><Link className="ctMarketsJoin" href="/register">{copy.register}</Link></nav></header>
    <section className="ctMarketsHero"><div><span className="ctMarketsEyebrow">CONNECT · {selectedCountry.name.toUpperCase()} · FINANCIAL MARKETS</span><h1>{copy.hero}<br/><em>{copy.hero2}</em></h1><p>{copy.intro}</p><div className="ctMarketsTags">{(copy.tags || marketCopy.en.tags).map(tag=><span key={tag}>{tag}</span>)}</div></div><div className="ctMarketsHeroArt" aria-hidden="true"><span>↗</span><b>MARKET<br/>WATCH</b><i>◒</i></div></section>
    <section className="ctMarketsTicker"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js" config={{...tickerConfig,symbols:selectedCountry.tickerSymbols,locale:language}} height={76} label="global market ticker" /></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} SNAPSHOT</span><h2>{copy.overview}</h2><p>{selectedCountry.name} indexes, leading local stocks, currencies and commodities.</p></div><small>Live or delayed by exchange and instrument</small></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js" config={{...overviewConfig,locale:language,tabs:[{title:selectedCountry.name,symbols:selectedCountry.indices},{title:"Stocks",symbols:selectedCountry.stocks.map(([s,d])=>({s,d}))},...overviewConfig.tabs.slice(2)]}} height={590} label="market overview" /></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>YOUR PERSONAL LIST</span><h2>{copy.watchlist}</h2><p>Save up to 30 ticker symbols to your Connect member account and access them across devices.</p></div><small>Account-synced</small></div>{watchlistStatus==="loading" ? <p className="ctMarketLoading">Loading your saved watchlist…</p> : watchlistStatus==="signed-out" ? <p className="ctMarketLoading">Sign in to Connect to save a personal watchlist that follows your account.</p> : watchlistStatus==="error" ? <p className="ctMarketsMessage" role="alert">{watchlistMessage || "Your account watchlist is unavailable."}</p> : <><form className="ctMarketsSearch" onSubmit={addToWatchlist}><label htmlFor="watchlist-symbol">Add ticker</label><input id="watchlist-symbol" value={watchInput} onChange={e=>setWatchInput(e.target.value)} placeholder="e.g. TSLA, AMZN, NYSE:IBM" maxLength={31}/><button type="submit">＋ {copy.add}</button></form><div className="ctMarketsWatchlist">{watchlist.length ? watchlist.map(item=><div className={symbol===item?"ctMarketsWatchItem active":"ctMarketsWatchItem"} key={item}><button type="button" onClick={()=>setSymbol(item)}>{item}</button><button type="button" aria-label={"Remove "+item} onClick={()=>void saveWatchlist(watchlist.filter(value=>value!==item))}>×</button></div>) : <p>Your watchlist is empty. Add a ticker above to get started.</p>}</div>{watchlistMessage && <p className="ctMarketsMessage" role="alert">{watchlistMessage}</p>}</>}</section>
    <section className="ctMarketsSection ctInvestmentAccounts">
      <div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} PROVIDERS</span><h2>{copy.accounts}</h2><p>{copy.accountIntro}</p></div><small>Secure sign-in stays with each provider</small></div>
      <div className="ctInvestmentAccountGrid">
        {investmentAccounts.filter(account => !account.countries || account.countries.includes("*") || account.countries.includes(countryCode)).map(account => <a className="ctInvestmentAccountCard" key={account.name} href={account.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${account.name} official website in a new tab`}>
          <div className="ctInvestmentAccountMark" aria-hidden="true">{account.mark}</div>
          <div className="ctInvestmentAccountInfo"><strong>{account.name}</strong><span>{account.type}</span></div>
          <span className="ctInvestmentAccountVisit">Visit official site <span aria-hidden="true">↗</span></span>
        </a>)}
      </div>
      <p className="ctInvestmentSecurity"><span aria-hidden="true">🔒</span> You sign in directly on each provider’s official website. Availability and eligibility vary by country and provider. Connect does not collect brokerage passwords or import account balances or holdings.</p>
    </section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} EQUITIES</span><h2>{copy.stock}</h2><p>Select a leading {selectedCountry.name} company or enter an exchange-qualified symbol. All detail panels follow your selection.</p></div><small>Quotes may be delayed by exchange</small></div><div className="ctMarketsQuickPick" aria-label="Popular stocks">{selectedCountry.stocks.map(([ticker,name])=><button type="button" key={ticker} className={symbol===ticker?"active":""} onClick={()=>{setSymbol(ticker);setSearch(ticker);setMessage("");}}>{name}<small>{ticker.split(":")[1]}</small></button>)}</div><form className="ctMarketsSearch" onSubmit={openSymbol}><label htmlFor="market-symbol">{copy.search}</label><input id="market-symbol" value={search} onChange={e=>setSearch(e.target.value)} placeholder="AAPL or NYSE:IBM" maxLength={30}/><button type="submit">{copy.load} ↗</button></form>{message&&<p className="ctMarketsMessage" role="alert">{message}</p>}<div className="ctStockDataGrid"><div className="ctMarketsPanel"><h3>Price, quote & key metrics</h3><TradingViewEmbed key={"quote-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js" config={{symbol,width:"100%",locale:language,colorTheme:"light",isTransparent:false}} height={190} label={symbol+" price and quote details"}/></div><div className="ctMarketsPanel"><h3>Technical analysis</h3><TradingViewEmbed key={"technical-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js" config={{symbol,interval:"1D",width:"100%",isTransparent:false,colorTheme:"light",locale:language}} height={420} label={symbol+" technical analysis"}/></div></div><div className="ctMarketsPanel ctStockProfile"><h3>Company profile</h3><TradingViewEmbed key={"profile-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js" config={{symbol,width:"100%",height:"100%",colorTheme:"light",isTransparent:false,locale:"en"}} height={250} label={symbol+" company profile"}/></div><div className="ctMarketsPanel ctStockFinancials"><h3>Financial statements & fundamentals</h3><TradingViewEmbed key={"financials-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-financials.js" config={{symbol,width:"100%",height:"100%",colorTheme:"light",isTransparent:false,displayMode:"adaptive",locale:"en"}} height={520} label={symbol+" financial statements and fundamentals"}/></div><div className="ctMarketsPanel ctStockHistory"><div className="ctStockPanelHead"><div><h3>Interactive price history</h3><p>Explore historical price movement and volume for {selectedTicker}.</p></div><div className="ctHistoryRanges" aria-label="Chart candle interval">{[["1m","1"],["5m","5"],["15m","15"],["1h","60"],["1D","D"],["1W","W"],["1M","M"]].map(([label,interval])=><button type="button" key={label} className={chartInterval===interval?"active":""} onClick={()=>setChartInterval(interval)}>{label}</button>)}</div></div><TradingViewEmbed key={"chart-"+symbol+"-"+chartInterval} src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js" config={{autosize:true,symbol,interval:chartInterval,timezone:({US:"America/New_York",GB:"Europe/London",DE:"Europe/Berlin",FR:"Europe/Paris",JP:"Asia/Tokyo",IN:"Asia/Kolkata",CA:"America/Toronto",AU:"Australia/Sydney",HK:"Asia/Hong_Kong",SG:"Asia/Singapore",BR:"America/Sao_Paulo"} as Record<string,string>)[countryCode] || "Etc/UTC",theme:"light",style:"1",locale:language,allow_symbol_change:true,withdateranges:true,calendar:false,support_host:"https://www.tradingview.com"}} height={570} label={symbol+" interactive price history chart"}/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} MARKET ACTIVITY</span><h2>{copy.movers}</h2><p>Stocks moving most in the {selectedCountry.name} market during the current session.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-hotlists.js" config={{...moversConfig,exchange:selectedCountry.exchange,locale:language}} height={450} label="top gaining, losing and active stocks"/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} MARKET MOMENTUM</span><h2>{copy.heatmap}</h2><p>Compare local company performance by sector and market capitalization.</p></div></div><div className="ctMarketsPanel"><TradingViewEmbed src="https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js" config={{dataSource:selectedCountry.heatmap,blockSize:"market_cap_basic",blockColor:"change",grouping:"sector",locale:language,symbolUrl:"",colorTheme:"light",exchanges:[],hasTopBar:false,isDataSetEnabled:false,isZoomEnabled:true,hasSymbolTooltip:true,isMonoSize:false,width:"100%",height:"100%"}} height={540} label="stock market heatmap"/></div></section>
    <section className="ctMarketsSection ctSelectedStockNews"><div className="ctMarketsSectionHead"><div><span>NEWS FOR THE SELECTED STOCK</span><h2>{selectedTicker} news & company updates</h2><p>Headlines and market stories related to {selectedTicker}. This feed changes when you select another stock.</p></div><small>TradingView news feed</small></div><div className="ctMarketsPanel"><TradingViewEmbed key={"news-"+symbol} src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" config={{feedMode:"symbol",symbol,displayMode:"regular",colorTheme:"light",isTransparent:false,locale:language,width:"100%",height:650}} height={670} label={selectedTicker+" stock-specific financial news"}/></div></section>
    <section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>{selectedCountry.name.toUpperCase()} NEWS</span><h2>{copy.regionalNews}</h2><p>Financial headlines related to the {selectedCountry.name} market index.</p></div><small>Regional index news</small></div><div className="ctMarketsPanel"><TradingViewEmbed key={"regional-news-"+countryCode+"-"+language} src="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js" config={{feedMode:"symbol",symbol:selectedCountry.primaryIndex,displayMode:"regular",colorTheme:"light",isTransparent:false,locale:language,width:"100%",height:620}} height={640} label={selectedCountry.name+" regional market news"}/></div></section><section className="ctMarketsSection"><div className="ctMarketsSectionHead"><div><span>WALL STREET VIEW</span><h2>{selectedTicker} analyst coverage & recommendations</h2><p>Review analyst consensus, rating changes, earnings estimates and price targets from an external financial-data provider.</p></div></div><div className="ctAnalystLivePanel">
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
    <footer className="ctMarketsFooter"><Link href="/">Connect</Link><span>© {new Date().getFullYear()} Techcyber LLC · {selectedCountry.name}</span><div><Link href="/news">News</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/privacy">Privacy</Link></div></footer>
  </main>;
}
