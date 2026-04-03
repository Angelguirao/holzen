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
| **`LOVABLE_API_KEY`** | Optional — for **`auth-hook/auth-email-hook-preview`** only (see below). |

### LOVABLE_API_KEY — you won’t get it from this repo

**Nobody can hand you the value here** — it is **your** project secret (provisioned by Lovable into Supabase, or set manually in the Supabase project).

**Where it is used:** Edge functions read it as **`LOVABLE_API_KEY`** from the **Supabase Edge runtime** (Dashboard → **Project Settings → Edge Functions → Secrets**). Supabase generally **does not show** existing secret values again; you can **rotate / set** a new value if you have permission.

**Do you need a “hosted” Bruno environment?** Bruno only sends HTTP. What matters is that **`VITE_SUPABASE_URL`** and keys match the stack you call:

- **Most `.bru` requests** only need **anon + user JWT** (or service role for `service-cron/`). The Lovable key stays **on the server** — you do **not** put it in Bruno for `holzen-reflect`, `companion-orchestrate`, etc.
- **Exception:** **`auth-hook/auth-email-hook-preview`** compares **`Authorization: Bearer …`** to **`LOVABLE_API_KEY`** inside the function. To run that request from Bruno you must put the **same** secret in **`local.bru`**. If you cannot obtain it, **skip that one request** — it does not block the rest of the collection.

**Local `supabase functions serve`:** use a gitignored **`supabase/.env`** with `LOVABLE_API_KEY=...` (see [.env.example](../.env.example) and [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets)). `supabase secrets list` on the linked project shows **names**, not values — you still need a one-time source for the string (dashboard rotate, team vault, or Lovable support if their provisioning never exposed it).

**Optional:** add a second Bruno environment (e.g. **Hosted**) with your production `VITE_SUPABASE_URL` / anon key when you want to hit **deployed** functions without running Docker locally — still no magic way to “download” `LOVABLE_API_KEY` unless you set or retrieve it from your own systems.

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

**Why this layout:** Folders are grouped by **credentials and risk**, not only by product name. That makes it obvious which **`Authorization`** value each request needs (user JWT vs service role vs Lovable key) and keeps high-blast-radius calls (**`service-cron/`**, destructive user actions) from looking like normal client API calls. **`pause-pipeline/`** stays separate as the main manual review slice for pause + companions. A domain-only layout (e.g. all “journal” endpoints in one place) would read nicely but mixes auth modes — fine as a future refactor if you prefer that mental model.

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
