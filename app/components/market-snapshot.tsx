type MarketIndex = { symbol: string; label: string; price: number; previousClose: number; currency: string };

const indices = [
  { symbol: "^GSPC", label: "S&P 500" },
  { symbol: "^IXIC", label: "NASDAQ" },
  { symbol: "^DJI", label: "Dow Jones" },
];

async function loadIndex(index: { symbol: string; label: string }): Promise<MarketIndex | null> {
  try {
    const response = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/" + encodeURIComponent(index.symbol) + "?range=1d&interval=1d",
      { next: { revalidate: 900 }, headers: { "User-Agent": "Mozilla/5.0 ConnectTime/1.0" }, signal: AbortSignal.timeout(6500) }
    );
    if (!response.ok) return null;
    const payload = await response.json() as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; currency?: string } }> };
    };
    const meta = payload.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const previousClose = meta?.chartPreviousClose ?? meta?.previousClose;
    if (typeof price !== "number" || typeof previousClose !== "number" || !Number.isFinite(price) || !Number.isFinite(previousClose)) return null;
    return { symbol: index.symbol, label: index.label, price, previousClose, currency: meta?.currency || "USD" };
  } catch {
    return null;
  }
}

export default async function MarketSnapshot() {
  const results = (await Promise.all(indices.map(loadIndex))).filter((item): item is MarketIndex => item !== null);
  return (
    <section className="ctMarketSnapshot" aria-labelledby="ct-market-snapshot-title">
      <div className="ctMarketHead"><div><span>MARKET WATCH</span><h2 id="ct-market-snapshot-title">Market indices</h2><p>Major U.S. benchmarks at a glance.</p></div><span aria-hidden="true">↗</span></div>
      {results.length ? <div className="ctMarketList">
        {results.map((item) => {
          const change = item.price - item.previousClose;
          const percent = item.previousClose ? (change / item.previousClose) * 100 : 0;
          return <article className="ctMarketIndex" key={item.symbol}>
            <div><strong>{item.label}</strong><small>{item.symbol}</small></div>
            <div><b>{item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b><small className={change >= 0 ? "ctMarketUp" : "ctMarketDown"}>{change >= 0 ? "+" : ""}{percent.toFixed(2)}%</small></div>
          </article>;
        })}
      </div> : <p className="ctMarketUnavailable">Market data is temporarily unavailable. Please check again shortly.</p>}
      <p className="ctMarketDisclaimer">Indicative index data from Yahoo Finance; quotes may be delayed. Not investment advice.</p>
    </section>
  );
}
