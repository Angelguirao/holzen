# Deployed Edge Functions (shipped)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

Source of truth: `supabase/config.toml` + [active-surface.md](../../docs/ops/active-surface.md). Undeployed / full-IA functions live under `supabase/functions/legacy/` — Bruno requests in [`../legacy/full-shell/`](../legacy/full-shell/).

| Name | Folder | Auth | Smoke |
| --- | --- | --- | --- |
| `health` | `platform/` | Anon `apikey` | Y |
| `holzen-number` | `public/` | Anon `apikey` | Y |
| `holzen-reflect` | `pause-pipeline/` | User JWT | Y |
| `companion-orchestrate` | `pause-pipeline/` | User JWT | Y |
| `check-subscription` | `billing/` | User JWT | Y |
| `ensure-trial-subscription` | `billing/` | User JWT | Y |
| `create-checkout` | `billing/` | User JWT | n |
| `customer-portal` | `billing/` | User JWT | n |
| `stripe-webhook` | — | Stripe signature | n (not Bruno) |
| `send-feedback` | `platform/` | User JWT | n |
| `register-push` | `platform/` | User JWT | n |
| `record-referral` | `platform/` | User JWT | n |
| `delete-account` | `platform/` | User JWT | DANGEROUS |
| `check-volatility` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `refresh-btc-prices` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `pregenerate-companions` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `process-referral-pending` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `backfill-btc-prices` | `service-cron/` | `SERVICE_CRON_BEARER` | ops |
| `seed-btc-history` | `service-cron/` | `SERVICE_CRON_BEARER` | ops |
| `auth-email-hook` | `auth-hook/` | Signed webhook / preview key | optional |
| `retry-flex-credit` | `billing/` | User JWT | Y |
| `list-checkout-events` | — | User JWT | no `.bru` yet |
| `notify-checkout-confirmation` | — | varies | no `.bru` yet |
| `ai-cost-alert` | — | service | no `.bru` yet |
| `grounding-enrich` | `pause-pipeline/` | User JWT | Y (companion Full View) |
| `process-email-queue` | — | admin/service | no `.bru` yet |
| `send-transactional-email` | — | service | no `.bru` yet |
| `preview-transactional-email` | — | service | no `.bru` yet |
| `handle-email-unsubscribe` | — | public | no `.bru` yet |
| `handle-email-suppression` | — | public | no `.bru` yet |
| `admin-check-stripe-prices` | — | admin | no `.bru` yet |

**Auth:** Supabase sign-in in `auth/` sets `SUPABASE_ACCESS_TOKEN`. Cron jobs use `SERVICE_CRON_BEARER` (service role or `CRON_SECRET`).
