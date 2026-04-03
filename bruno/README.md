# Bruno — Holzen HTTP review

Collection root for [Bruno](https://www.usebruno.com/) (`.bru` files). Use it to step through Supabase Edge Functions with the same headers the app uses. See [docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md) for philosophy and when to use tests vs the SPA.

## One-time setup

1. **Install Bruno** (desktop app) from [usebruno.com](https://www.usebruno.com/).
2. **Open this folder as a collection:** File → Open Collection → choose folder `holzen/bruno` (the directory that contains `bruno.json`).
3. **Create your local environment**
   - Copy `environments/local.bru.example` to **`environments/local.bru`** (same folder).
   - Edit `local.bru` with real values:
     - **`SUPABASE_URL`** — `https://<project-ref>.supabase.co` with **no trailing slash**.
     - **`SUPABASE_ANON_KEY`** — project anon key (same role as `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`).
     - **`ACCESS_TOKEN`** — short-lived **user** JWT after sign-in in the app (DevTools → Application → local storage Supabase session, or Auth → copy user session).
4. In Bruno, select the **local** environment (top bar) so `{{SUPABASE_URL}}` etc. resolve.

`local.bru` is **gitignored**; never commit tokens.

## What’s in the collection

| Folder / request | Purpose |
|------------------|---------|
| `pause-pipeline/01-holzen-reflect` | POST reflection JSON; minimal body (`context`). |
| `pause-pipeline/02-companion-orchestrate` | POST companion orchestrator; minimal body enables **Signal** only. Add a real `reflectionId` in the JSON body to test intervention + ownership checks against your DB. |

## Running a review

1. Send requests **in order** (01 → 02) the first time you smoke-test.
2. In Supabase Dashboard → **Edge Functions** → logs, filter by time and look for **`cid`** in JSON log lines ([logging strategy](../docs/ops/logging-strategy.md)).
3. If you get **401**, refresh `ACCESS_TOKEN` or confirm `apikey` + `Authorization` match the project.

## Adding requests

- Duplicate a `.bru` file, change `url`/`body`, and bump `seq` in `meta` if you care about ordering.
- Prefer **one folder per review theme** (e.g. `billing/`, `stripe-webhooks/`) as flows grow.
