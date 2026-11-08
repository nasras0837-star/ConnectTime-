# Connect Marketplace — Appwrite setup

The Marketplace page supports member listings for lawful goods and property, including real estate, vehicles, electronics, furniture, clothing, comic books, sports cards, collectibles, home and garden, tools, books, toys, and other products.

## Required environment
Set this server-only variable in the Connect deployment:
- `APPWRITE_MARKETPLACE_ITEMS_TABLE_ID`

The existing Appwrite settings are also required:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server-only)
- `APPWRITE_DATABASE_ID`
- `APPWRITE_PROFILES_TABLE_ID`
- `APPWRITE_ACCESS_DATABASE_ID`
- `APPWRITE_MEMBER_ACCESS_COLLECTION_ID`
- `APPWRITE_COMMUNITY_BLOCKS_TABLE_ID`

## Create the Appwrite table

Create a table in the database referenced by `APPWRITE_DATABASE_ID`, then set its ID as `APPWRITE_MARKETPLACE_ITEMS_TABLE_ID`.

Add these columns (all required unless marked optional):

| Column | Type | Notes |
|---|---|---|
| seller_user_id | string | Required; max 128 |
| category | string | Required; max 60 |
| title | string | Required; max 100 |
| description | string | Required; max 1800 |
| price | float | Required; USD |
| currency | string | Required; default USD |
| condition_label | string | Required; max 40 |
| location | string | Required; max 100 |
| status | string | Required; active, removed, sold |
| created_at | datetime | Required |
| updated_at | datetime | Required |

Create indexes:
- `status + created_at` (key; descending created_at where supported)
- `seller_user_id + created_at`

Keep the table private to server-side API access. Do not grant anonymous create/update/delete permissions. The API derives the seller ID from the authenticated session, requires verified adult member access, checks seller eligibility, profile visibility and reciprocal member blocks, applies a per-user posting limit, and blocks listings matching prohibited sexual-services language.

## Listing policy and safety

Marketplace is for lawful physical products, vehicles and real property only. Prostitution, escort services, sexual services, paid sexual activity, and solicitations or advertisements for those services are prohibited. Such listings are rejected by server-side phrase screening. Members can report listings for review. Staff should review reports and remove prohibited listings/accounts under the Connect Community Guidelines and Terms.

This initial listing form is text-only: photo uploads, checkout, escrow, shipping, buyer protection, identity checks for property/vehicle transactions, and seller payouts are not enabled. Buyers contact sellers through Connect Messages. Users should verify the item, seller, title/ownership, payment method, and transaction location independently before paying or meeting.

## Deployment note

The feature code can be deployed before the Appwrite table is configured, but API requests will return a configuration error until the table and environment variable exist. No live marketplace listing is created until the backend setup is complete.
