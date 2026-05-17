# Service / cron (shipped at MVP)

MVP keeps volatility, BTC cache, companion pregeneration, referral processing, and optional BTC backfill/seed. **Digest, night reflection, letters, and library ingest** moved to [`../../legacy/full-shell/service-cron/`](../../legacy/full-shell/service-cron/).

## `SERVICE_CRON_BEARER`

Every request uses:

```http
Authorization: Bearer {{SERVICE_CRON_BEARER}}
x-cid: bruno-{{$timestamp}}-review
```

Set **`SERVICE_CRON_BEARER`** in `environments/hosted.bru` or `local.bru` to the project **service_role** JWT or **`CRON_SECRET`** (see [`verifyServiceAuth`](../../../supabase/functions/_shared/auth.ts)).

| File | Function |
| --- | --- |
| `check-volatility.bru` | `check-volatility` |
| `refresh-btc-prices.bru` | `refresh-btc-prices` |
| `pregenerate-companions.bru` | `pregenerate-companions` |
| `process-referral-pending.bru` | `process-referral-pending` |
| `backfill-btc-prices.bru` | `backfill-btc-prices` (ops; chain `resumeFrom`) |
| `seed-btc-history.bru` | `seed-btc-history` (ops bulk seed) |

Do not run destructive or high-cost jobs against production without intent.
