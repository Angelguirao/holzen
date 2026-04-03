# Service / cron Edge Functions

These calls use **`Authorization: Bearer {{SUPABASE_SERVICE_ROLE_KEY}}`** (or `CRON_SECRET` if you set the same value in env — the code checks both). Get the service role from Supabase Dashboard → **Settings → API** (never commit it).

Do **not** run destructive cron jobs against production without intent. Some functions call external APIs (CoinGecko, AI, email).

| File | Function |
|------|----------|
| `check-followups.bru` | `check-followups` |
| `check-volatility.bru` | `check-volatility` |
| `weekly-digest.bru` | `weekly-digest` |
| `monthly-report.bru` | `monthly-report` |
| `night-reflection.bru` | `night-reflection` |
| `personalized-nudge.bru` | `personalized-nudge` |
| `deliver-letters.bru` | `deliver-letters` |
| `pregenerate-companions.bru` | `pregenerate-companions` |
| `fetch-source-feeds.bru` | `fetch-source-feeds` |
| `refresh-btc-prices.bru` | `refresh-btc-prices` |

`fetch-source-feeds` also accepts **`x-supabase-cron: true`** instead of Bearer (see source); service role is simplest for Bruno.
