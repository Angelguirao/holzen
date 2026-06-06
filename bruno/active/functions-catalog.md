# Deployed Edge Functions (shipped)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

Source of truth: `supabase/config.toml` + [active-surface.md](../../docs/ops/active-surface.md). Undeployed / full-IA functions live under `supabase/functions/legacy/` — Bruno requests in [`../legacy/full-shell/`](../legacy/full-shell/).

| Name | Folder | Auth | Smoke |
| --- | --- | --- | --- |
| `health` | `platform/` | Anon `apikey` | Y |
| `holzen-number` | `public/` | Anon `apikey` | Y |
| `market-quote` | `public/` | User JWT | Y |
| `holzen-reflect` | `pause-pipeline/` | User JWT | Y |
| `companion-orchestrate` | `pause-pipeline/` | User JWT | Y |
| `check-subscription` | `billing/` | User JWT | Y |
| `ensure-trial-subscription` | `billing/` | User JWT | Y |
| `retry-flex-credit` | `billing/` | User JWT | Y |
| `create-checkout` | `billing/` | User JWT | n |
| `customer-portal` | `billing/` | User JWT | n |
| `list-checkout-events` | `billing/` | User JWT | n |
| `notify-checkout-confirmation` | `billing/` | User JWT | ops |
| `admin-check-stripe-prices` | `billing/` | Admin user JWT | ops |
| `send-feedback` | `platform/` | User JWT | n |
| `register-push` | `platform/` | User JWT | n |
| `record-referral` | `platform/` | User JWT | n |
| `delete-account` | `platform/` | User JWT | DANGEROUS |
| `preview-transactional-email` | `email/` | Ops bearer (`EMAIL_PREVIEW_SECRET` or `CRON_SECRET`) | ops |
| `send-transactional-email` | `email/` | User JWT or service-role JWT | ops |
| `handle-email-unsubscribe` | `email/` | Public token | n |
| `process-email-queue` | `email/` | Service-role JWT only | ops |
| `check-volatility` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `refresh-market-prices` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `pregenerate-companions` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `process-referral-pending` | `service-cron/` | `SERVICE_CRON_BEARER` | staging |
| `backfill-market-prices` | `service-cron/` | `SERVICE_CRON_BEARER` | ops |
| `seed-market-history` | `service-cron/` | `SERVICE_CRON_BEARER` | ops |
| `ai-cost-alert` | `service-cron/` | `SERVICE_CRON_BEARER` | ops |
| `auth-email-hook` | `auth-hook/` | Signed webhook / preview key | optional |
| `stripe-webhook` | — | Stripe signature | not Bruno |
| `handle-email-suppression` | — | Resend Svix webhook signature | not Bruno |

**Auth:** Supabase sign-in in `auth/` sets `SUPABASE_ACCESS_TOKEN`. Cron jobs use `SERVICE_CRON_BEARER` (service role or `CRON_SECRET`). `process-email-queue` is stricter: it requires a real **service-role JWT**, not `CRON_SECRET`.
