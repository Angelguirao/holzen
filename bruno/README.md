# Bruno — Holzen HTTP review

Collection root for [Bruno](https://www.usebruno.com/) (`.bru` files). See **[SCOPE.md](SCOPE.md)** for what Bruno can and cannot cover (HTTP vs the whole React app), and **[functions-catalog.md](functions-catalog.md)** for every Edge Function URL.

[docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md) explains when to use Bruno vs tests vs the SPA.

## One-time setup

1. **Install Bruno** (desktop app) from [usebruno.com](https://www.usebruno.com/).
2. **Open this folder as a collection:** File → Open Collection → choose folder `holzen/bruno` (the directory that contains `bruno.json`).
3. **Create your local environment**
   - Copy `environments/local.bru.example` to **`environments/local.bru`** (same folder).
   - Edit `local.bru`:
     - **`VITE_SUPABASE_URL`** — from `.env` / `.env.localstack.local` / `.env.hosted.local` (e.g. `http://127.0.0.1:54321`). **No trailing slash.**
     - **`VITE_SUPABASE_PUBLISHABLE_KEY`** — anon key (local: `npm run supabase:status`).
     - **`AUTH_EMAIL`** / **`AUTH_PASSWORD`** — used by sign-up and sign-in (pick a **dedicated test** email; do not commit real passwords — `local.bru` is gitignored).
4. Select the **local** environment in Bruno’s toolbar.

## Greenfield: no users yet

1. Run **`auth/00-sign-up-password`** once. If the project returns a session (typical for local with confirmation off), **`SUPABASE_ACCESS_TOKEN`** is set for this Bruno session.
2. If sign-up returns **no session** (email confirmation), confirm the user in **Supabase Studio → Authentication** or adjust Auth settings for local dev, then run **`auth/01-sign-in-password`**.
3. If the user **already exists**, sign-up may fail — run **`auth/01-sign-in-password`** only.

## Returning users

Run **`auth/01-sign-in-password`** when the token expires or you open a new Bruno session (or paste a JWT into the environment as **`SUPABASE_ACCESS_TOKEN`**).

**Limits:** Email/password only. Magic link, OAuth, or MFA need a pasted token or a different flow. See [SCOPE.md](SCOPE.md).

## Pause pipeline (after auth)

| Request | Purpose |
|---------|---------|
| `pause-pipeline/01-holzen-reflect` | POST reflection; minimal `context`. |
| `pause-pipeline/02-companion-orchestrate` | Companion orchestrator; add `reflectionId` for full intervention checks. |

## Running a review

1. **`auth/00`** (optional) → **`auth/01`** → **`pause-pipeline/01`** → **`02`**.
2. **Edge logs:** Supabase Dashboard → Edge Functions → match timestamps / JSON **`cid`** ([logging strategy](../docs/ops/logging-strategy.md)).
3. **401:** Re-run **`01`** or fix `VITE_*` / `AUTH_*`.

## “Full app” coverage

Bruno cannot mirror **every screen** — only **HTTP APIs**. The catalog lists **all** Edge Function paths; add `.bru` files per feature as you need them (duplicate headers from `pause-pipeline/` and bodies from `supabase/functions/<name>/index.ts`).

## Adding requests

- One folder per theme (`billing/`, …).
- Duplicate an existing `.bru`, set `url` and `body` from the function source.
