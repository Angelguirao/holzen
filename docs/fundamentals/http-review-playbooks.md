# HTTP review playbooks (Postman, Bruno, etc.)

Use a **step-by-step HTTP client** when you want to **review or debug multi-call flows** (auth → edge function → follow-up) with a clear trail: request order, headers, bodies, status codes, and rough timing. That complements **markdown review docs** (`docs/reviews/`) and **server-side logs** (Supabase Dashboard → Edge Functions → Logs).

For **live SPA** inspection (network, console, Lighthouse, performance traces) via **Chrome DevTools MCP**, see **[browser-360-mcp-playbook.md](browser-360-mcp-playbook.md)** — it does **not** replace HTTP clients or E2E tests.

## When this helps

- Tracing **401/403** on `invoke` (wrong `Authorization`, missing `apikey`, or function not listed in `supabase/config.toml` — see [AGENTS.md](../../AGENTS.md)).
- Walking a **pause / edge AI / companion** path call-by-call without stepping through the SPA.
- Comparing **hosted** vs **local** `supabase functions serve` behavior with the same payloads.

## When something else is better

- **UI / full product journeys** (click-through pause, journal, settings): HTTP clients cannot drive the SPA. Use **Playwright**, **Cypress**, or **Vitest + React Testing Library** — tracked as [e2e-browser-automation.md](../backlog/e2e-browser-automation.md). Bruno stays for **API review** only; see [bruno/SCOPE.md](../../bruno/SCOPE.md).
- **Automated regression:** prefer Vitest or integration tests against `functions serve`, not only manual clicks.
- **RLS-heavy behavior:** the browser uses the user JWT; calling Postgres via REST still needs the same identity — document whether you’re testing as **the user** (JWT) or **service role** (dangerous; never commit).

## Bruno vs Postman

| | **Bruno** | **Postman** |
|---|------------|-------------|
| **Repo-friendly** | Collections are plain `.bru` files; easy to diff and code-review | Often one JSON export; fine if you commit exports deliberately |
| **Secrets** | Use a **gitignored** environment file (see `bruno/environments/` in this repo) | Use environments + local vault; don’t export secrets into the collection |
| **Sharing** | Git + PR | Postman Cloud / export files |

Pick one tool and keep **one** canonical exported collection (or Bruno folder) if the team agrees to maintain it.

## Supabase Edge Functions: URL and headers

- **URL:** `{{VITE_SUPABASE_URL}}/functions/v1/<function-name>`  
  Example: `http://127.0.0.1:54321/functions/v1/holzen-reflect` (local) or `https://<project-ref>.supabase.co/functions/v1/holzen-reflect` (hosted).
- **Typical headers** (same as the JS client’s `invoke`):
  - `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>` — user session JWT from sign-in (see below); not stored in `.env`.
  - `apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>` — same anon/publishable key as in `.env` / `.env.localstack.local` (public to the client; still treat repo copies carefully).
  - `Content-Type: application/json` for POST bodies.

Some functions validate the Bearer token in code even when `[functions.<name>]` has `verify_jwt = false` in `config.toml` — the gateway may not enforce JWT, but the function still returns 401 without a valid user token.

### Service role calls (`bruno/service-cron/*`)

Cron-style Edge functions expect **`Authorization: Bearer {{SERVICE_CRON_BEARER}}`** (see `bruno/service-cron/check-volatility.bru`). Set **`SERVICE_CRON_BEARER`** to the **service_role** JWT (**Dashboard → Project Settings → API**) or, on hosts without dashboard access, to the same **`CRON_SECRET`** string configured on Edge — not the anon/publishable key.

If Bruno returns **`401 Unauthorized`**, the bearer value usually **does not match** the project’s **service_role** or **`CRON_SECRET`** (wrong project, typo, stale env). Fix **`SERVICE_CRON_BEARER`**, then retry; redeploying the function does not correct a bad client secret.

For **pg_cron**, use **Vault** + `vault.decrypted_secrets` in the `Authorization` header (hosted Supabase does not set `current_setting('supabase.service_role_key')`) — see [Cron HTTP auth in cron-setup.md](../ops/cron-setup.md#cron-http-auth).

### Getting an `access_token` for manual calls

**Option A — Bruno (recommended):** run **`auth/00-sign-up-password`** if you have no user yet, then **`auth/01-sign-in-password`** (or only **`01`** if the user already exists). Sign-up uses `POST /auth/v1/signup`; sign-in uses `POST /auth/v1/token?grant_type=password`. Both set **`SUPABASE_ACCESS_TOKEN`** when the response includes a session. See [bruno/SCOPE.md](../../bruno/SCOPE.md) for greenfield vs email confirmation.

**Option B — Manual:** run the app locally, sign in, open DevTools → **Application** → **Local Storage** and copy **`access_token`** from the Supabase session JSON, then paste into **`SUPABASE_ACCESS_TOKEN`** in Bruno (`local.bru` or `hosted.bru`, whichever environment is active).

Password auth does not cover magic link, OAuth, or MFA-only accounts—use Option B or a test user without those gates.

Never commit tokens, passwords, or service role keys.

## Suggested “logging each step” workflow

1. **Name requests** in order: `01 sign-in (optional if token from app)`, `02 holzen-reflect`, …
2. After each request, note **status**, **request id** if present, and **one line** of outcome in your review notes (or Postman/Bruno run log).
3. Open **Supabase → Edge Functions → [function] → Logs** in another tab and align timestamps with your calls.
4. For failing steps, capture **response body** (sanitized) and whether **RLS**, **rate limits**, or **missing secrets** (e.g. `LOVABLE_API_KEY`) are indicated.

## Relating to repo docs

- High-level pipelines: [systems/pause/ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) and phased [reviews/](../reviews/).
- Cron / HTTP callouts: [ops/cron-setup.md](../ops/cron-setup.md).
- Failure modes checklist: [ops/observability-and-failures.md](../ops/observability-and-failures.md).

## Repo collection (Bruno)

A starter collection lives at **`bruno/`** (see `bruno.json` and `pause-pipeline/*.bru`).

1. **Open** the `bruno` folder in Bruno (not the repo root).
2. Copy **`bruno/environments/local.bru.example`** → **`local.bru`**, or **`hosted.bru.example`** → **`hosted.bru`** for the hosted Supabase URL; fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and **`AUTH_EMAIL` / `AUTH_PASSWORD`**; run **`auth/00-sign-up-password`** and/or **`auth/01-sign-in-password`**, or paste a JWT into **`SUPABASE_ACCESS_TOKEN`** in Bruno. Full catalog: [bruno/functions-catalog.md](../../bruno/functions-catalog.md).
3. Run requests in order; pair with Edge Function logs.

Details: [bruno/README.md](../../bruno/README.md).
