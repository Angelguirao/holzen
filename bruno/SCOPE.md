# What Bruno covers for Holzen

Holzen is a **React SPA** (`src/`) plus **Supabase** (Postgres, Auth, Edge Functions). Bruno only speaks **HTTP** — not UI, React Router, or TanStack Query.

## Default collection = `active/`

| Tree | Use when |
| --- | --- |
| **[`active/`](active/)** | **Shipped MVP** — auth, pause pipeline, billing, platform, shipped crons. Start here. |
| **[`legacy/full-shell/`](legacy/full-shell/)** | Pre-strip reference only; many functions **undeployed** on production after MVP. |

Catalog of deployed functions: [`active/functions-catalog.md`](active/functions-catalog.md). Root [`functions-catalog.md`](functions-catalog.md) redirects there.

### What Bruno can cover

| Surface | In Bruno? | Notes |
| --- | --- | --- |
| **Supabase Auth** (`/auth/v1/*`) | Yes | `active/auth/` |
| **Edge Functions** (`/functions/v1/<name>`) | Yes | One `.bru` per flow; must match `supabase/config.toml` |
| **PostgREST** (`/rest/v1/*`) | Rare | App uses `supabase-js` + RLS |
| **React pages** | No | Vitest integration **F1–F9**, Playwright backlog |
| **Stripe webhooks** | No | Needs Stripe signatures or `stripe listen` |

### Greenfield auth

1. Set **`AUTH_EMAIL`** / **`AUTH_PASSWORD`** in `environments/local.bru` or `hosted.bru`.
2. Run **`active/auth/00-sign-up-password`** or **`01-sign-in-password`**.
3. If no session (email confirmation), confirm user in Studio or sign in after confirm.

### When you need more than Bruno

- **E2E journeys** (login → pause): Playwright / Vitest — see `src/test/integration/flows/`.
- **Regression**: `npm run test` + `npm run test:ci`.
