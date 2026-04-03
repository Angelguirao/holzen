# Edge Functions catalog (HTTP URLs)

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

Most handlers expect **POST** with **JSON**; all use **`Authorization: Bearer <user JWT>`** and/or **`apikey: <anon>`** depending on the function — see each `supabase/functions/<name>/index.ts` (and `config.toml` `[functions.<name>]`).

| Name | Path |
|------|------|
| auth-email-hook | `/functions/v1/auth-email-hook` |
| badge-notify | `/functions/v1/badge-notify` |
| check-followups | `/functions/v1/check-followups` |
| check-subscription | `/functions/v1/check-subscription` |
| check-volatility | `/functions/v1/check-volatility` |
| companion-orchestrate | `/functions/v1/companion-orchestrate` |
| create-checkout | `/functions/v1/create-checkout` |
| customer-portal | `/functions/v1/customer-portal` |
| delete-account | `/functions/v1/delete-account` |
| deliver-letters | `/functions/v1/deliver-letters` |
| fetch-source-feeds | `/functions/v1/fetch-source-feeds` |
| generate-wallpaper | `/functions/v1/generate-wallpaper` |
| holzen-number | `/functions/v1/holzen-number` |
| holzen-reflect | `/functions/v1/holzen-reflect` |
| journal-prompt | `/functions/v1/journal-prompt` |
| monthly-report | `/functions/v1/monthly-report` |
| night-reflection | `/functions/v1/night-reflection` |
| personalized-nudge | `/functions/v1/personalized-nudge` |
| pregenerate-companions | `/functions/v1/pregenerate-companions` |
| record-referral | `/functions/v1/record-referral` |
| reflection-insights | `/functions/v1/reflection-insights` |
| refresh-btc-prices | `/functions/v1/refresh-btc-prices` |
| register-push | `/functions/v1/register-push` |
| send-feedback | `/functions/v1/send-feedback` |
| suggest-grounding | `/functions/v1/suggest-grounding` |
| suggest-ritual | `/functions/v1/suggest-ritual` |
| weekly-digest | `/functions/v1/weekly-digest` |

**Source of truth for names:** `supabase/config.toml` under `[functions.<name>]`.

**Repo requests implemented today:** `auth/` (sign-up, sign-in), `pause-pipeline/` (holzen-reflect, companion-orchestrate), `billing/` (create-checkout, check-subscription, customer-portal). Add more `.bru` files as you review each area.
