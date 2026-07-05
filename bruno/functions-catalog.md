# Edge Functions catalog (HTTP URLs)

> **Deployed source of truth:** Use **[`active/functions-catalog.md`](active/functions-catalog.md)** for the shipped surface. This root file is a transition map so older doc links still land somewhere accurate.

Base URL: **`{{VITE_SUPABASE_URL}}/functions/v1/<name>`**

## Active collection map

Shipped requests live under **`bruno/active/`**:

| Bruno folder | Covers |
| --- | --- |
| `active/auth/` | Supabase auth sign-up and sign-in |
| `active/auth-hook/` | Auth email preview / hook-adjacent smoke |
| `active/public/` | Public anon endpoints |
| `active/pause-pipeline/` | User-JWT pause and companion flows |
| `active/billing/` | Stripe checkout, subscription, retry, and billing admin checks |
| `active/email/` | Transactional-email preview, enqueue, unsubscribe, queue ops |
| `active/platform/` | Health, feedback, push, referral, delete-account |
| `active/service-cron/` | Shipped cron / service endpoints |

Notable endpoints intentionally **not** modeled as plain Bruno requests:

| Function | Why not Bruno-first |
| --- | --- |
| `stripe-webhook` | Requires a valid Stripe signature |
| `handle-email-suppression` | Requires valid Resend Svix webhook headers |

## Legacy full-shell map

Retired requests are kept under **`bruno/legacy/full-shell/`** for recovery against pre-strip tags. They are **not** the shipped surface.

| Function | Legacy Bruno path | Auth notes |
| --- | --- | --- |
| `badge-notify` | `legacy/full-shell/user-jwt/` | User JWT |
| `deliver-letters` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |
| `fetch-source-feeds` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |
| `generate-wallpaper` | `legacy/full-shell/user-jwt/` | User JWT |
| `journal-prompt` | `legacy/full-shell/user-jwt/` | User JWT |
| `monthly-report` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |
| `night-reflection` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |
| `personalized-nudge` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |
| `reflection-insights` | `legacy/full-shell/user-jwt/` | User JWT or service auth, depending on mode |
| `suggest-grounding` | `legacy/full-shell/user-jwt/` | User JWT |
| `suggest-ritual` | `legacy/full-shell/user-jwt/` | User JWT |
| `weekly-digest` | `legacy/full-shell/service-cron/` | `SERVICE_CRON_BEARER` |

**Source of truth for deployed names:** `supabase/config.toml` under `[functions.<name>]`.
