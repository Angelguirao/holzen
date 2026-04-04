# Service / cron Edge Functions

## Bruno: `SERVICE_CRON_BEARER`

Every request uses:

```http
Authorization: Bearer {{SERVICE_CRON_BEARER}}
```

Set **`SERVICE_CRON_BEARER`** in your Bruno environment (**`environments/hosted.bru`** or **`local.bru`**, gitignored) to **either**:

| Where you get credentials | What to paste into `SERVICE_CRON_BEARER` |
|---------------------------|------------------------------------------|
| **Supabase Dashboard** → Settings → API | **`service_role`** JWT (full secret string) |
| **Lovable Cloud** (no dashboard) | The **`CRON_SECRET`** value your platform uses for Edge secrets — it is compared to the same secret on the server |

The Edge runtime compares the Bearer string to **`SUPABASE_SERVICE_ROLE_KEY`** and **`CRON_SECRET`** in the function environment ([`verifyServiceAuth`](../../supabase/functions/_shared/auth.ts)). The Bruno variable name is neutral because **both** server env vars are valid targets for the same header.

Do **not** use the **anon** / publishable key as `SERVICE_CRON_BEARER` — these workers return **401**.

## Why auth looked “different” before

All **`service-cron/`** workers now share the same **`verifyServiceAuth`** implementation for the **Bearer** path (service role JWT or `CRON_SECRET`).

**`refresh-btc-prices`**, **`fetch-source-feeds`**, and **`pregenerate-companions`** additionally pass **`allowSupabaseCronHeader: true`**, so they still accept **`x-supabase-cron: true`** without a Bearer token. That matches older pg_cron / host invoke patterns; it is **spoofable** on a public function URL, so prefer **`SERVICE_CRON_BEARER`** in Bruno and in Vault-backed cron SQL.

**`check-volatility`**, **`night-reflection`**, and the other `verifyServiceAuth` callers do **not** enable that header — only a valid Bearer (or a future deliberate change) unlocks them.

## Files

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

Do **not** run destructive cron jobs against production without intent. Some functions call external APIs (CoinGecko, AI, email).
