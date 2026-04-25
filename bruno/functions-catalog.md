# Edge Functions catalog (HTTP URLs)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

**Bruno coverage:** Most functions below have a matching `.bru` under `bruno/` (see folder READMEs). Bodies are minimal smoke-test payloads — read `supabase/functions/<name>/index.ts` for full contracts. Functions removed from production (e.g. Pause V2) are omitted from the table.

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
