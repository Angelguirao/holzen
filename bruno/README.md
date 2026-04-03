# Bruno — Holzen HTTP review

Collection root for [Bruno](https://www.usebruno.com/) (`.bru` files). Use it to step through Supabase Edge Functions with the same headers the app uses. See [docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md) for philosophy and when to use tests vs the SPA.

## One-time setup

1. **Install Bruno** (desktop app) from [usebruno.com](https://www.usebruno.com/).
2. **Open this folder as a collection:** File → Open Collection → choose folder `holzen/bruno` (the directory that contains `bruno.json`).
3. **Create your local environment**
   - Copy `environments/local.bru.example` to **`environments/local.bru`** (same folder).
   - Edit `local.bru` using the **same names as Vite** where applicable:
     - **`VITE_SUPABASE_URL`** — from `.env`, `.env.localstack.local`, `.env.hosted.local`, etc. (e.g. `http://127.0.0.1:54321` for local Docker Supabase, or `https://<ref>.supabase.co` for hosted). **No trailing slash.**
     - **`VITE_SUPABASE_PUBLISHABLE_KEY`** — same anon/publishable key as in those files (local: `npm run supabase:status`).
     - **`AUTH_EMAIL`** / **`AUTH_PASSWORD`** — a **test user** that exists in that Supabase project (local: create in Studio **Authentication** or sign up once). Used only by **`auth/00-sign-in-password`**. **Do not commit** real passwords; `local.bru` is gitignored.
     - **`SUPABASE_ACCESS_TOKEN`** — not in the example file: run **`auth/00-sign-in-password`** first; it sets this **in memory** for the Bruno session. If you skip password auth, add `SUPABASE_ACCESS_TOKEN` in Bruno’s environment UI and paste a JWT from the app.
4. In Bruno, select the **local** environment (top bar).

`local.bru` is **gitignored**; never commit tokens or passwords.

## Auth (recommended)

1. Run **`auth/00-sign-in-password`** once per Bruno session (or after token expires). It calls `POST /auth/v1/token?grant_type=password` and stores **`SUPABASE_ACCESS_TOKEN`** for the other requests.
2. Then run **`pause-pipeline/01`** → **`02`** (or any function that needs a user JWT).

**Limits:** Email/password only (same as `signInWithPassword`). Magic link, OAuth, or MFA need a different flow or a pasted token. For local Supabase, ensure the user exists and email confirmation is off or the user is confirmed, or sign-in will fail.

## What’s in the collection

| Folder / request | Purpose |
|------------------|---------|
| `auth/00-sign-in-password` | Password sign-in → sets **`SUPABASE_ACCESS_TOKEN`** for the session. |
| `pause-pipeline/01-holzen-reflect` | POST reflection JSON; minimal body (`context`). |
| `pause-pipeline/02-companion-orchestrate` | POST companion orchestrator; minimal body enables **Signal** only. Add a real `reflectionId` in the JSON body to test intervention + ownership checks against your DB. |

## Running a review

1. Run **`auth/00-sign-in-password`** (or paste a JWT into `SUPABASE_ACCESS_TOKEN` in `local.bru`).
2. Run **`pause-pipeline/01`** → **`02`**.
3. In Supabase Dashboard → **Edge Functions** → logs, filter by time and look for **`cid`** in JSON log lines ([logging strategy](../docs/ops/logging-strategy.md)).
4. If you get **401**, re-run sign-in or confirm `VITE_SUPABASE_*` and `AUTH_*` match the project and user.

## Adding requests

- Duplicate a `.bru` file, change `url`/`body`, and bump `seq` in `meta` if you care about ordering.
- Prefer **one folder per review theme** (e.g. `billing/`, `stripe-webhooks/`) as flows grow.
