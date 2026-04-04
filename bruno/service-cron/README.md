# Service / cron Edge Functions

These requests send **`Authorization: Bearer <token>`**. The Edge runtime accepts the token if it equals **`SUPABASE_SERVICE_ROLE_KEY`** or **`CRON_SECRET`** (when that secret is set), except where noted below. The `.bru` files use **`{{SUPABASE_SERVICE_ROLE_KEY}}`** as the variable name — you may put the **service_role JWT** or the **`CRON_SECRET`** string there; both work for the same `Bearer` comparison on the server.

- **With Supabase Dashboard access:** copy **service_role** from **Settings → API** into Bruno (never commit it).
- **Hosted via Lovable Cloud (no dashboard):** use the **`CRON_SECRET`** value your platform exposes for cron; paste it into **`SUPABASE_SERVICE_ROLE_KEY`** in Bruno if that is the only slot, or add a **`CRON_SECRET`** env var and change the header to `Bearer {{CRON_SECRET}}` for clarity.

Do **not** run destructive cron jobs against production without intent. Some functions call external APIs (CoinGecko, AI, email).

## Auth implementation (code, not all `verifyServiceAuth`)

| File | Function | How auth is checked |
|------|----------|---------------------|
| `check-followups.bru` | `check-followups` | `verifyServiceAuth` |
| `check-volatility.bru` | `check-volatility` | `verifyServiceAuth` |
| `weekly-digest.bru` | `weekly-digest` | `verifyServiceAuth` |
| `monthly-report.bru` | `monthly-report` | `verifyServiceAuth` |
| `night-reflection.bru` | `night-reflection` | `verifyServiceAuth` |
| `personalized-nudge.bru` | `personalized-nudge` | `verifyServiceAuth` |
| `deliver-letters.bru` | `deliver-letters` | `verifyServiceAuth` |
| `pregenerate-companions.bru` | `pregenerate-companions` | service role or `CRON_SECRET` (inline) |
| `fetch-source-feeds.bru` | `fetch-source-feeds` | service role, `CRON_SECRET`, or `x-supabase-cron: true` |
| `refresh-btc-prices.bru` | `refresh-btc-prices` | service role, `CRON_SECRET`, or `x-supabase-cron: true` |

Use the **anon** key as `Authorization` only for user-scoped flows — these workers will return **401**.
