# Connect Markets analyst data setup

Connect's Markets page can display analyst consensus and recent rating actions for the selected stock through the Massive API's Benzinga datasets.

## Provider and plan

The integration uses:
- `GET /benzinga/v1/consensus-ratings/{ticker}` for the consensus rating, buy/hold/sell distribution, contributing analyst counts, and low/average/high price targets.
- `GET /benzinga/v1/ratings?ticker={ticker}&limit=8&sort=last_updated.desc` for recent individual analyst rating and price-target changes.

The provider currently lists Benzinga Analyst Ratings at **$99/month** on its individual plans. Confirm current plan access, commercial display rights, rate limits, and coverage with the provider before subscribing or using the data publicly.

## Configure

1. Create or use a Massive account with the Benzinga Analyst Ratings dataset enabled.
2. In the server-side hosting environment (Netlify or the future Connect backend), add:
   `MASSIVE_API_KEY=your_private_api_key`
3. Keep this variable server-only. Do not use a `NEXT_PUBLIC_` prefix, commit the value, or put it in browser code.
4. Redeploy the Next.js application.
5. Open Markets, select a supported US stock, and confirm the analyst consensus and rating-change rows populate.

Without the key, the endpoint returns a clear unavailable response; it does not show sample or invented ratings.

## Endpoint

`GET /api/markets/analyst?ticker=AAPL`

The server validates the ticker, calls Massive from the backend, limits recent changes to eight records, caches upstream responses for 15 minutes, and returns a normalized payload. API errors are sanitized before being sent to the browser.

## Important

- The analyst panel is informational and displays third-party research, not investment advice or a Connect recommendation.
- Consensus counts and price targets can differ by data provider, analyst coverage, currency, and update time.
- The consensus dataset is listed as updating every two hours; individual rating actions are listed as real-time by the provider.
- A configured API key alone does not guarantee access: the account must have the correct dataset entitlement.
- TradingView continues to supply the embedded chart, quote, technical, fundamentals, and selected-stock news widgets.
