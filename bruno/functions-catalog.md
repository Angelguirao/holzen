# Edge Functions catalog (HTTP URLs)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

**Bruno coverage:** The table lists functions that already have **named smoke `.bru` files** under `bruno/` (see folder READMEs). Bodies are minimal — read `supabase/functions/<name>/index.ts` for full contracts. Deployed functions without a row here simply lack Bruno coverage yet.

### All deployed edge functions (`supabase/config.toml`)

Alphabetical names (each must match `supabase/functions/<name>/`):

`admin-check-stripe-prices` · `admin-library-preview` · `ai-cost-alert` · `auth-email-hook` · `backfill-btc-prices` · `badge-notify` · `check-subscription` · `check-volatility` · `companion-orchestrate` · `create-checkout` · `customer-portal` · `delete-account` · `deliver-letters` · `fetch-source-feeds` · `generate-wallpaper` · `grounding-enrich` · `handle-email-suppression` · `handle-email-unsubscribe` · `health` · `holzen-number` · `holzen-reflect` · `journal-prompt` · `list-checkout-events` · `monthly-report` · `night-reflection` · `notify-checkout-confirmation` · `personalized-nudge` · `pregenerate-companions` · `preview-transactional-email` · `process-email-queue` · `process-referral-pending` · `record-referral` · `reflection-insights` · `refresh-btc-prices` · `register-push` · `retry-flex-credit` · `seed-btc-history` · `send-feedback` · `send-transactional-email` · `stripe-webhook` · `suggest-grounding` · `suggest-ritual` · `weekly-digest`

**`verify_jwt = true` (must send a user JWT, not only `apikey`):** `admin-library-preview`, `process-email-queue`, `admin-check-stripe-prices`. All other entries above use `verify_jwt = false` in this repo — still read each handler for custom auth (e.g. `SERVICE_CRON_BEARER`, Stripe signatures).

| Name | Bruno folder | Auth notes |
|------|----------------|------------|
| auth-email-hook | `auth-hook/` | Preview: `LOVABLE_API_KEY`. Main webhook: signed Lovable payload only. |
| badge-notify | `user-jwt/` | User JWT |
| check-subscription | `billing/` | User JWT |
| check-volatility | `service-cron/` | `SERVICE_CRON_BEARER` |
| companion-orchestrate | `pause-pipeline/` | User JWT |
| create-checkout | `billing/` | User JWT |
| customer-portal | `billing/` | User JWT |
| delete-account | `user-jwt/` (DANGEROUS) | User JWT |
| deliver-letters | `service-cron/` | `SERVICE_CRON_BEARER` |
| fetch-source-feeds | `service-cron/` | `SERVICE_CRON_BEARER` |
| generate-wallpaper | `user-jwt/` | User JWT |
| holzen-number | `public/` | Anon `apikey` only |
| holzen-reflect | `pause-pipeline/` | User JWT |
| journal-prompt | `user-jwt/` | User JWT |
| monthly-report | `service-cron/` | `SERVICE_CRON_BEARER` |
| night-reflection | `service-cron/` | `SERVICE_CRON_BEARER` |
| personalized-nudge | `service-cron/` | `SERVICE_CRON_BEARER` |
| pregenerate-companions | `service-cron/` | `SERVICE_CRON_BEARER` |
| record-referral | `user-jwt/` | User JWT |
| reflection-insights | `user-jwt/` | User JWT + `user_id` in body, **or** batch (no `user_id`) with `SERVICE_CRON_BEARER` / `verifyServiceAuth` |
| refresh-btc-prices | `service-cron/` | `SERVICE_CRON_BEARER` |
| backfill-btc-prices | `service-cron/` | `SERVICE_CRON_BEARER` — POST `from`/`to` (`YYYY-MM-DD`, span ≤ ~12y), optional `onlyMissing`, `dryRun`, `chunkDays`, `maxChunks`; repeat with `from: resumeFrom` until `completed` |
| register-push | `user-jwt/` | User JWT |
| send-feedback | `user-jwt/` | User JWT |
| suggest-grounding | `user-jwt/` | User JWT |
| suggest-ritual | `user-jwt/` | User JWT |
| weekly-digest | `service-cron/` | `SERVICE_CRON_BEARER` |

**Source of truth for names:** `supabase/config.toml` under `[functions.<name>]`.
