# Bruno — Holzen HTTP review

Collection root for [Bruno](https://www.usebruno.com/) (`.bru` files). See **[SCOPE.md](SCOPE.md)** for HTTP vs the React app, and **[functions-catalog.md](functions-catalog.md)** for every Edge Function URL.

[docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md) explains when to use Bruno vs tests vs the SPA.

## One-time setup

1. **Install Bruno** (desktop app) from [usebruno.com](https://www.usebruno.com/).
2. **Open this folder as a collection:** File → Open Collection → choose folder `holzen/bruno` (the directory that contains `bruno.json`).
3. Copy **`environments/local.bru.example`** → **`environments/local.bru`** and fill:

| Variable | Purpose |
|----------|---------|
| **`VITE_SUPABASE_URL`** | Same as Vite (e.g. `http://127.0.0.1:54321`). No trailing slash. |
| **`VITE_SUPABASE_PUBLISHABLE_KEY`** | Anon key (`npm run supabase:status` for local). |
| **`AUTH_EMAIL`** / **`AUTH_PASSWORD`** | Test user for sign-up / sign-in. |
| **`SUPABASE_SERVICE_ROLE_KEY`** | For **`service-cron/`** requests only — Dashboard → **Settings → API** (never commit). |
| **`LOVABLE_API_KEY`** | Optional — for **`auth-hook/auth-email-hook-preview`** only. |

**After auth:** `auth/00` and `auth/01` set **`SUPABASE_ACCESS_TOKEN`** and **`AUTH_USER_ID`** when the Auth API returns a `user` object. If you paste a JWT manually, add **`AUTH_USER_ID`** in Bruno for **`user-jwt/reflection-insights`**.

4. Select the **local** environment in Bruno’s toolbar.

## Folder layout (every Edge Function)

| Folder | Auth | Contents |
|--------|------|----------|
| **`auth/`** | Sign-up / sign-in | `00-sign-up-password`, `01-sign-in-password` |
| **`public/`** | Anon `apikey` only | `holzen-number` (RPC; no user JWT) |
| **`pause-pipeline/`** | User JWT | `holzen-reflect`, `companion-orchestrate` |
| **`billing/`** | User JWT | Stripe Checkout, subscription check, portal |
| **`user-jwt/`** | User JWT | `badge-notify`, `suggest-grounding`, `suggest-ritual`, `journal-prompt`, `reflection-insights`, `register-push`, `send-feedback`, `generate-wallpaper`, `record-referral`, **`delete-account-DANGEROUS`** |
| **`service-cron/`** | **Service role** (`SUPABASE_SERVICE_ROLE_KEY`) | Cron-style workers: `check-followups`, `check-volatility`, `weekly-digest`, `monthly-report`, `night-reflection`, `personalized-nudge`, `deliver-letters`, `pregenerate-companions`, `fetch-source-feeds`, `refresh-btc-prices` |
| **`auth-hook/`** | **`LOVABLE_API_KEY`** | `auth-email-hook-preview` only (HTML preview). The real webhook is signed — not in Bruno. |

**`delete-account-DANGEROUS`** deletes the signed-in user — use a throwaway test account only.

## Typical flows

1. **User flows:** `auth/01` → any of `pause-pipeline/`, `billing/`, `user-jwt/` (skip `delete-account` unless intentional).
2. **Cron / batch:** fill **`SUPABASE_SERVICE_ROLE_KEY`**, then run requests under **`service-cron/`** (can hit external APIs and send emails — use staging/local first).
3. **Email template preview:** set **`LOVABLE_API_KEY`**, run **`auth-hook/auth-email-hook-preview`**.

## Running a review

- **Edge logs:** Supabase Dashboard → Edge Functions → match timestamps / JSON **`cid`** ([logging strategy](../docs/ops/logging-strategy.md)).
- **401 on user calls:** Re-run **`auth/01`** or fix `VITE_*` / `AUTH_*`.
- **401 on service-cron:** Service role or `CRON_SECRET` must match what the function expects ([`verifyServiceAuth`](../supabase/functions/_shared/auth.ts)).

## “Full app” coverage

Bruno covers **all HTTP Edge Functions** in this repo with at least one `.bru` per function (except the signed webhook body for `auth-email-hook`). It does **not** cover React UI — see [docs/backlog/e2e-browser-automation.md](../docs/backlog/e2e-browser-automation.md).
