# Edge Functions catalog (HTTP URLs)

> **Pause-first shipped:** Use **[`active/functions-catalog.md`](active/functions-catalog.md)** for the **deployed** surface and Bruno folder map. This file is a **historical** index (includes undeployed full-IA functions).

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

**Bruno coverage:** Shipped requests live under **`bruno/active/`**. Retired `.bru` files are in **`bruno/legacy/full-shell/`**. Bodies are minimal — read `supabase/functions/<name>/index.ts` for contracts.

### Historical index (includes undeployed full-IA names)

This list is **not** the shipped surface. Names like `export-user-data`, `badge-notify`, and `fetch-source-feeds` may appear here but are **not** in `supabase/config.toml` on the pause-first branch. For deployed functions only, see **[`active/functions-catalog.md`](active/functions-catalog.md)** (~27 edges).

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
| ensure-trial-subscription | `billing/`, `active/` | User JWT — onboarding trial (no Checkout redirect) |
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
