# Connect Markets watchlist storage setup

The Markets watchlist is stored per signed-in Connect member in the existing Appwrite database. It is not stored in browser local storage.

## Appwrite table

In the Appwrite Console, open the **Connect** project's configured database (the database ID used by `APPWRITE_DATABASE_ID`) and create a table with an ID of your choice, for example `market_watchlists`.

Add these columns:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `user_id` | String | Yes | Maximum 128 characters; stores the authenticated Appwrite user ID |
| `symbols_json` | String | Yes | Allow at least 4,096 characters; JSON array of exchange-qualified ticker symbols |
| `created_at` | String | Yes | ISO-8601 timestamp |
| `updated_at` | String | Yes | ISO-8601 timestamp |

The API uses the authenticated member's Appwrite user ID as the row ID, so each member has one row. The API verifies the row's `user_id` matches the current session before returning or updating it.

## Deployment environment

Set this server-side environment variable in the Connect Next.js hosting environment:

```env
APPWRITE_MARKET_WATCHLIST_TABLE_ID=market_watchlists
```

Do not prefix it with `NEXT_PUBLIC_`. The existing `APPWRITE_API_KEY` must remain server-only and should have only the database permissions required by the Connect API. Do not grant direct public/client access to this table.

## Behavior

- Signed-in members can save up to 30 symbols.
- Symbols are normalized to uppercase and must include an exchange prefix, e.g. `NASDAQ:AAPL` or `NYSE:IBM`.
- Members can only read or change their own watchlist.
- Unauthenticated requests receive HTTP 401.
- The API rejects cross-origin writes and invalid symbols.
- The browser does not silently fall back to local-only storage if account storage is unavailable.

The API route is `/api/markets/watchlist`. Until the table and environment variable are configured in the Connect deployment, the feature will report that account watchlist storage is unavailable; it will not pretend changes were saved.
