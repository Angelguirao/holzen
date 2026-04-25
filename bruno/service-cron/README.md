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

Those workers used copy-pasted checks instead of **`verifyServiceAuth`**; they are aligned now.

We **do not** accept **`x-supabase-cron: true`** without a valid Bearer on worker endpoints. Edge URLs are public, so that header is **not** authentication. Cron and Bruno should use **`Authorization: Bearer …`** with the service role JWT or **`CRON_SECRET`** ([`verifyServiceAuth`](../../supabase/functions/_shared/auth.ts)).

**`reflection-insights`** batch mode (no `user_id` in body) uses the same **`verifyServiceAuth`** — call it from cron/Bruno with **`SERVICE_CRON_BEARER`**, not `x-supabase-cron`.

## Files

| File | Function |
|------|----------|
| `check-volatility.bru` | `check-volatility` |
| `weekly-digest.bru` | `weekly-digest` |
| `monthly-report.bru` | `monthly-report` |
| `night-reflection.bru` | `night-reflection` |
| `personalized-nudge.bru` | `personalized-nudge` |
| `process-referral-pending.bru` | `process-referral-pending` |
| `deliver-letters.bru` | `deliver-letters` |
| `pregenerate-companions.bru` | `pregenerate-companions` |
| `fetch-source-feeds.bru` | `fetch-source-feeds` |
| `refresh-btc-prices.bru` | `refresh-btc-prices` |
| `backfill-btc-prices.bru` | `backfill-btc-prices` — optional ops backfill for `btc_price_cache` (CoinGecko); chain on **`resumeFrom`** until **`completed`** (see `cron-setup.md`) |

Do **not** run destructive cron jobs against production without intent. Some functions call external APIs (CoinGecko, AI, email).
