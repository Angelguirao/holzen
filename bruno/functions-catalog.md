# Edge Functions catalog (HTTP URLs)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

**Bruno coverage:** Every function below has a matching `.bru` under `bruno/` (see folder READMEs). Bodies are minimal smoke-test payloads — read `supabase/functions/<name>/index.ts` for full contracts.

| Name | Bruno folder | Auth notes |
|------|----------------|------------|
| auth-email-hook | `auth-hook/` | Preview: `LOVABLE_API_KEY`. Main webhook: signed Lovable payload only. |
| badge-notify | `user-jwt/` | User JWT |
| check-followups | `service-cron/` | Service role / cron |
| check-subscription | `billing/` | User JWT |
| check-volatility | `service-cron/` | Service role / cron |
| companion-orchestrate | `pause-pipeline/` | User JWT |
| create-checkout | `billing/` | User JWT |
| customer-portal | `billing/` | User JWT |
| delete-account | `user-jwt/` (DANGEROUS) | User JWT |
| deliver-letters | `service-cron/` | Service role / cron |
| fetch-source-feeds | `service-cron/` | Service role or `x-supabase-cron` |
| generate-wallpaper | `user-jwt/` | User JWT |
| holzen-number | `public/` | Anon `apikey` only |
| holzen-reflect | `pause-pipeline/` | User JWT |
| journal-prompt | `user-jwt/` | User JWT |
| monthly-report | `service-cron/` | Service role / cron |
| night-reflection | `service-cron/` | Service role / cron |
| personalized-nudge | `service-cron/` | Service role / cron |
| pregenerate-companions | `service-cron/` | Service role / cron |
| record-referral | `user-jwt/` | User JWT |
| reflection-insights | `user-jwt/` | User JWT (+ `user_id` in body) or batch via service/cron in code |
| refresh-btc-prices | `service-cron/` | Service role / cron |
| register-push | `user-jwt/` | User JWT |
| send-feedback | `user-jwt/` | User JWT |
| suggest-grounding | `user-jwt/` | User JWT |
| suggest-ritual | `user-jwt/` | User JWT |
| weekly-digest | `service-cron/` | Service role / cron |

**Source of truth for names:** `supabase/config.toml` under `[functions.<name>]`.
