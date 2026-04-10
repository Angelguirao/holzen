# What “full Bruno coverage” means for Holzen

Holzen is mostly a **React SPA** (`src/`) plus **Supabase** (Postgres, Auth, Edge Functions). Bruno only speaks **HTTP**. It cannot drive the UI, React Router, service worker, or TanStack Query cache behavior.

### What Bruno can cover (the callable surface)

| Surface | In Bruno? | Notes |
|--------|-----------|--------|
| **Supabase Auth** (`/auth/v1/*`) | Yes | Sign-up, sign-in, refresh (add if needed), etc. |
| **Edge Functions** (`/functions/v1/<name>`) | Yes | One `.bru` per flow with correct method, headers, JSON body. |
| **PostgREST** (`/rest/v1/*`) | Yes | Rare for manual review; app uses `supabase-js` + RLS. |
| **React pages & components** | No | Use **Vitest**, **Playwright**, or manual QA. |
| **Stripe webhooks** | Partially | Needs real **Stripe** signatures or `stripe listen` — not a single static `.bru` without tooling. |

So **“whole app” in Bruno** means: **document and exercise every HTTP API you care about** (auth + edge functions + optional REST), not every screen.

### Greenfield (no users yet)

1. Set **`AUTH_EMAIL`** / **`AUTH_PASSWORD`** in `local.bru` to a **new** test address (e.g. `bruno-test@local.test`).
2. Run **`auth/00-sign-up-password`**. If your project returns a session immediately (common on local when email confirmation is off), **`SUPABASE_ACCESS_TOKEN`** is set automatically.
3. If sign-up returns **no session** (e.g. confirmation required), confirm the user in **Supabase Studio → Authentication** or run **`auth/01-sign-in-password`** after the user exists.
4. If the user **already exists**, sign-up may error — **skip to `01-sign-in-password`** only.

### Collection layout

The repo **`bruno/`** folder includes a **`.bru` request for every Edge Function** (see **[functions-catalog.md](functions-catalog.md)**): `auth/`, `public/`, `pause-pipeline/`, `billing/`, `user-jwt/`, `service-cron/`, `auth-hook/` (preview only). Adjust JSON bodies per `supabase/functions/<name>/index.ts` when you need stricter tests.

### When you need more than Bruno

- **E2E user journeys** (login → pause → journal): Playwright or Cypress against `npm run dev`.
- **Regression**: Vitest + integration tests for stable contracts.
