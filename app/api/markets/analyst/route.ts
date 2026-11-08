import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TICKER_PATTERN = /^[A-Z0-9.-]{1,15}$/;

type ApiEnvelope<T> = { results?: T[]; status?: string; error?: string };
type Consensus = {
  ticker?: string;
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
type Rating = {
  ticker?: string;
  company_name?: string;
  analyst?: string;
  firm?: string;
  date?: string;
  last_updated?: string;
  rating?: string;
  previous_rating?: string;
  rating_action?: string;
  price_target_action?: string;
  price_target?: number;
  previous_price_target?: number;
  currency?: string;
  benzinga_calendar_url?: string;
};

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim().toUpperCase() || "";
  if (!TICKER_PATTERN.test(ticker)) {
    return NextResponse.json({ error: "Enter a valid stock ticker." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, error: "Integrated analyst data is not connected yet. Add a Massive API key to enable consensus and rating changes." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const consensusUrl = new URL(`https://api.massive.com/benzinga/v1/consensus-ratings/${encodeURIComponent(ticker)}`);
  consensusUrl.searchParams.set("limit", "1");
  consensusUrl.searchParams.set("apiKey", apiKey);
  const ratingsUrl = new URL("https://api.massive.com/benzinga/v1/ratings");
  ratingsUrl.searchParams.set("ticker", ticker);
  ratingsUrl.searchParams.set("limit", "8");
  ratingsUrl.searchParams.set("sort", "last_updated.desc");
  ratingsUrl.searchParams.set("apiKey", apiKey);

  try {
    const [consensusResponse, ratingsResponse] = await Promise.all([
      fetch(consensusUrl, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) }),
      fetch(ratingsUrl, { next: { revalidate: 900 }, signal: AbortSignal.timeout(10000) }),
    ]);
    if (!consensusResponse.ok || !ratingsResponse.ok) {
      const upstreamStatus = !consensusResponse.ok ? consensusResponse.status : ratingsResponse.status;
      console.error("Analyst data provider returned an error", upstreamStatus);
      return NextResponse.json({ error: upstreamStatus === 401 || upstreamStatus === 403
        ? "The analyst-data API key or plan does not include this dataset."
        : upstreamStatus === 429
          ? "The analyst-data provider rate limit was reached. Try again shortly."
          : "Analyst data is temporarily unavailable from the provider." },
      { status: upstreamStatus === 429 ? 429 : 502, headers: { "Cache-Control": "no-store" } });
    }

    const [consensusData, ratingsData] = await Promise.all([
      consensusResponse.json() as Promise<ApiEnvelope<Consensus>>,
      ratingsResponse.json() as Promise<ApiEnvelope<Rating>>,
    ]);
    const consensus = consensusData.results?.[0] || null;
    const ratings = (ratingsData.results || [])
      .filter(item => (item.ticker || "").toUpperCase() === ticker)
      .slice(0, 8)
      .map(item => ({
        companyName: item.company_name || ticker,
        analyst: item.analyst || null,
        firm: item.firm || null,
        date: item.date || item.last_updated || null,
        rating: item.rating || null,
        previousRating: item.previous_rating || null,
        ratingAction: item.rating_action || null,
        priceTargetAction: item.price_target_action || null,
        priceTarget: typeof item.price_target === "number" ? item.price_target : null,
        previousPriceTarget: typeof item.previous_price_target === "number" ? item.previous_price_target : null,
        currency: item.currency || "USD",
        sourceUrl: item.benzinga_calendar_url || null,
      }));
    return NextResponse.json({ configured: true, ticker, consensus, ratings, source: "Benzinga via Massive", fetchedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } });
  } catch (error) {
    console.error("Analyst data request failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not retrieve analyst data right now. Please try again shortly." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
