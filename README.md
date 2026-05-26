# Holzen

Holzen is a React + TypeScript single-page app focused on **Bitcoin-aware mindfulness**: pause rituals when markets move, AI companions, archive, and subscription billing via Supabase edge functions.

## Pause-first shipped product

The active app is a **pause-first MVP**: four primary tabs (Home, Archive, Journey, Settings), full-screen `/pause` ritual, and Stripe-native **7-day trial** (no card) via `ensure-trial-subscription`. After trial, users need a paid subscription to **engage** pauses; Archive and Journey stay readable when **lapsed**. Legacy Tools, stats, and library routes return **404** (no redirects).

- **What ships:** [docs/ops/active-surface.md](docs/ops/active-surface.md)
- **Why / recovery:** [docs/decisions/2026-05-16-pause-first-shipped-scope.md](docs/decisions/2026-05-16-pause-first-shipped-scope.md) · tag `full-ia-pre-strip`
- **Launch checklist:** [docs/ops/launch-runbook.md](docs/ops/launch-runbook.md)

## Stack

| Layer | Technology |
|--------|------------|
| UI | React 18, React Router, Tailwind CSS, shadcn-ui (Radix), Framer Motion |
| Data & auth | Supabase (`@supabase/supabase-js`), TanStack Query |
| Forms & validation | React Hook Form, Zod |
| Build | Vite 5, TypeScript, `@vitejs/plugin-react-swc` |
| PWA | `vite-plugin-pwa` with inject manifest (`src/sw.ts`) |
| i18n | react-i18next |

Payments and server-side integrations (Stripe, email, push, AI companions) live in **Supabase Edge Functions** under `supabase/functions/`.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) and npm

## Getting started

```sh
git clone <repository-url>
cd holzen
npm install
```

Environment variables (see [.env.example](.env.example) and [docs/ops/environment-matrix.md](docs/ops/environment-matrix.md)):

- **Vercel (prod/preview):** Set `VITE_SUPABASE_*`, `VITE_SENTRY_DSN`, `VITE_POSTHOG_*`, `VITE_APP_VERSION` in the Vercel project. See [docs/ops/vercel-frontend-setup.md](docs/ops/vercel-frontend-setup.md).
- **Default (local machine):** `cp .env.example .env` then `npm run dev` — uses your `.env` values. `VITE_SUPABASE_*` is now required for `npm run dev` and `npm run build`; missing values fail fast instead of silently pointing at a hosted project.
- **Two files / two backends (optional on your machine):** **`.env.prod.local`** is for **`npm run dev:prod`** when you want the app on your laptop to use **production** Supabase. If you want **staging**, use **`.env.staging.local`** / **`npm run dev:staging`**. If you **only** develop against **local Docker** Supabase, use **`.env.localstack`** / **`npm run dev:local`** and you can **ignore** `.env.prod` entirely.
  - **Prod-like from local Vite:** copy [.env.prod.example](.env.prod.example) to **`.env.prod.local`**, fill in URL + anon key, run **`npm run dev:prod`**.
  - **Local Docker only:** copy [.env.localstack.example](.env.localstack.example) to **`.env.localstack.local`**, set the anon key from `npm run supabase:status`, run **`npm run dev:local`**.

The app reads **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_PUBLISHABLE_KEY`**. **`VITE_ADMIN_USER_IDS`** is optional (comma-separated auth user UUIDs); admin access may also be governed in the database (e.g. `is_admin` / `is_admin()`) depending on your setup.

Start the dev server (Vite is configured for **port 8080**):

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). For hosted Supabase you do **not** need Docker for everyday frontend work.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR (default mode; requires `VITE_SUPABASE_*` in `.env*`) |
| `npm run dev:prod` | Dev server using `.env.prod` / `.env.prod.local` (optional: hit **production** Supabase from your PC) |
| `npm run dev:local` | Dev server using `.env.localstack` / `.env.localstack.local` (local Supabase only) |
| `npm run build` | Production build (runs **`check:version-sync`** via **`prebuild`**; requires explicit Supabase env) |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (jsdom), single run |
| `npm run test:ci` | `check:edge-logging` + `check:edge-coverage-manifest` + Vitest with coverage and JUnit output (CI-style gate) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run check:view-migrations` | Fail if a migration uses unsafe `CREATE OR REPLACE VIEW` renames (also run from `check:prepush`) |
| `npm run supabase:start` | Local Supabase stack (Docker); same as `npx supabase start` |
| `npm run supabase:functions:serve` | Serve local Edge Functions (reads `supabase/.env.local`, then `supabase/.env`, then OS env) |
| `npm run supabase:status` | Print local API URL and anon key |
| `npm run supabase:stop` | Stop local stack |
| `npm run supabase:reset` | Reapply `supabase/migrations/` on local DB |
| `npm run env:doctor` | Print current frontend targets, repo-local Supabase link state, and local Docker status |
| `npm run gen:types` | Regenerate `src/integrations/supabase/types.ts` from the explicit **production** project ref; use `npm run gen:types:staging` for staging |
| `npm run check:edge-logging` | Fail if an edge function serves HTTP without `withRequestLogging` (runs in `test:ci` / `check:prepush`) |
| `npm run check:edge-coverage-manifest` | Fail if `EdgeCoverage.tsx` is missing any `supabase/config.toml` edge function name (runs in `test:ci` / `check:prepush`) |
| `npm run check:edge` | Optional **Deno** typecheck of every `supabase/functions/*/index.ts`; **no-op** if `deno` is not installed |
| `npm run check:prepush` | Full bash preflight (`scripts/pre-push-check.sh`); use **Git Bash** or **WSL** on Windows |
| `npm run smoke:edge-logging` | Optional live HTTP probe of edge `x-cid` behavior (see `supabase/functions/README.md`) |
| `npm run test:coverage` | Vitest with coverage (no JUnit; use **`test:ci`** for logging guards + JUnit) |
| `npm run check:version-sync` | `package.json` version vs latest `changelog_entries` (runs automatically as **`prebuild`** on **`npm run build`**) |
| `npm run stamp:release` | Refresh **`supabase/functions/_shared/release.ts`** (`EDGE_RELEASE` = **`git rev-parse --short=12 HEAD`**) for edge observability releases |
| `npm run check:release-stamp` | Verify **`EDGE_RELEASE`** in **`release.ts`** matches **`git rev-parse --short=12 HEAD`** (no write) |

## Repository layout

- **`src/`** — Application code. Import alias **`@`** maps to `./src` (see `vite.config.ts` and `vitest.config.ts`).
- **`src/screens/`** — Route-level presentation (home, archive, pause, settings, marketing, admin, etc.); routing is defined in `src/App.tsx`.
- **`src/components/`** — Shared UI, including `components/ui` (shadcn-style primitives).
- **`supabase/migrations/`** — SQL migrations for the hosted database.
- **`supabase/functions/`** — Edge functions (Deno): checkout, subscriptions, notifications, AI companions, and related HTTP APIs. They run on Supabase in production; **secrets** (Stripe, Resend, Google AI / OpenRouter, VAPID, etc.) are configured in the Supabase dashboard, not in the frontend `.env`.
- **`docs/`** — **[Docs index and onboarding path](docs/README.md)** (C4, fundamentals, systems, reviews); **[C4 architecture](docs/architecture/c4-holzen.md)** (context + container diagrams and optional Structurizr DSL); the Signal companion pipeline is in [docs/systems/pause/companions/signal.md](docs/systems/pause/companions/signal.md) (linked from the [pause system](docs/systems/pause/ai-powered-pause-system.md) doc).
- **`public/`** — Static assets served as-is.

## Supabase & backend

- **Schema changes**: apply migrations with your usual Supabase workflow (e.g. linked project + `supabase db push`, or dashboard SQL). Migrations in this repo are the source of truth for the database shape. To **try migrations safely on your machine**, see [Local Supabase and migrations](#local-supabase-and-migrations) below.
- **Edge functions**: each folder under `supabase/functions/<name>/` is a deployable function; shared code lives in `supabase/functions/_shared/`.
- **Local frontend only**: the publishable Supabase key in `.env` is safe for the browser; never commit server keys or edge secrets to the repo.

## Local Supabase and migrations

For everyday UI work you can point `.env` at a **hosted** Supabase project only ([Getting started](#getting-started)). To **iterate on SQL** without touching production, use the [Supabase CLI](https://supabase.com/docs/guides/cli) with **Docker** (for example Docker Desktop on Windows).

**Installing the CLI:** `npm install -g supabase` is **not supported**. After `npm install` in this repo, the CLI is available as a **dev dependency**—use `npx supabase …` or the `npm run supabase:*` scripts in the [npm scripts](#npm-scripts) table. On Windows you can also install via [Scoop](https://scoop.sh) ([Supabase docs](https://github.com/supabase/cli#install-the-cli)).

1. From the repo root, start the local stack:

   ```sh
   npm run supabase:start
   ```

   (Equivalent: `npx supabase start`.)

2. Read the **API URL** and **anon** key from that output, or run:

   ```sh
   npm run supabase:status
   ```

3. Copy [.env.localstack.example](.env.localstack.example) to **`.env.localstack.local`**, set **`VITE_SUPABASE_PUBLISHABLE_KEY`** from `npm run supabase:status`, and run **`npm run dev:local`** (or put the same values in `.env` and use `npm run dev` — but two-file workflow keeps hosted vs local separate).

4. Rebuild the local database from `supabase/migrations/` whenever you need a clean apply:

   ```sh
   npm run supabase:reset
   ```

When migrations are ready, commit the SQL files under `supabase/migrations/` and apply them to your hosted project (e.g. [link the CLI](https://supabase.com/docs/guides/cli/local-development#link-your-project) to that project and `npx supabase db push`, or run the SQL via the dashboard), following your team’s process.

### Full local stack

For the most isolated setup, run all three pieces together:

```sh
npm run supabase:start
npm run supabase:functions:serve
npm run dev:local
```

- `npm run supabase:start` brings up the local platform (DB, auth, storage, Studio, API gateway).
- `npm run supabase:functions:serve` serves your Edge Function handlers locally.
- `npm run dev:local` runs the React app against the local Supabase URL/key in `.env.localstack.local`.

The local API gateway exposes `http://127.0.0.1:55421/functions/v1`, but your function routes are only actually handled once the function server is running.

**Edge function secrets:** Start from `supabase/.env.example`, then copy it to `supabase/.env` (shared local defaults) or `supabase/.env.local` (personal overrides). The CLI reads `supabase/.env.local`, then `supabase/.env`, then OS env. Add only the secrets needed for the flows you are testing locally: Stripe test keys, Resend/auth-email values, AI provider keys, VAPID keys, or observability overrides.

**Vendor-backed flows:** Billing, transactional email, AI calls, and some ops paths still depend on third-party credentials even when the function code is running locally. For Stripe webhooks, you can forward events into the local stack with:

```sh
stripe listen --forward-to http://127.0.0.1:55421/functions/v1/stripe-webhook
```

**Edge functions:** You can also run functions locally with `npx supabase functions serve`, but production behavior depends on **Supabase dashboard secrets** (Stripe, email, AI keys, etc.). Local testing may need those set for the CLI or a `.env` used by `supabase functions serve`—see [Supabase Functions local secrets](https://supabase.com/docs/guides/functions/secrets).

**No Docker:** Use a separate hosted project (staging), put its URL and anon key in `.env`, and apply migrations there before production.

## PWA & offline

The app registers a custom service worker from `src/sw.ts` for installability and caching behavior. Behavior may differ between development and production builds.

## Design system

Visual work follows **Nox** (`docs/design/nox/`, Figma keys in that README). For AI-assisted UI work, the repo also keeps **[DESIGN.md](DESIGN.md)** at the root ([Google DESIGN.md](https://github.com/google-labs-code/design.md) format: YAML tokens + prose); **`src/index.css`** remains the runtime token source. Optional check: `npm run design:lint`.

## Linting & tests

ESLint is enabled project-wide. The tree may report many existing issues; treat new changes as the bar for cleanliness. Tests use Vitest with Testing Library where present.

**Production builds** run **`npm run check:version-sync`** first (`prebuild` hook) so **`package.json` `version`** stays aligned with the latest **`changelog_entries`** row for the configured Supabase project.

**Edge functions:** After changing `supabase/functions/**/*.ts`, run **`npm run check:edge`** if you have [Deno](https://deno.land/) on your `PATH` — it runs `deno check` on each function’s `index.ts`. If Deno is missing, the script exits successfully and prints a skip message (so CI can call it without installing Deno unless you want stricter checks). Before shipping edge changes, ensure **`npm run stamp:release`** has been run (or run **`npm run check:prepush`**, which stamps and warns if **`release.ts`** drifted).

## Hosting & optional Lovable editor

**Production:** GitHub → **Vercel** (SPA) + **owned Supabase** (DB + Edge). Branch model: [docs/ops/branch-model.md](docs/ops/branch-model.md). Setup: [docs/ops/vercel-frontend-setup.md](docs/ops/vercel-frontend-setup.md) · [docs/ops/platform-exit-runbook.md](docs/ops/platform-exit-runbook.md).

The project was initially scaffolded with [Lovable](https://lovable.dev). You may keep Lovable as an **optional visual editor** on feature branches only — not as prod host or migration path. See [docs/ops/lovable-staging-and-platform-exit.md](docs/ops/lovable-staging-and-platform-exit.md).

Deploy behavior (migrations, edges, frontend): [docs/fundamentals/navigating-the-codebase.md](docs/fundamentals/navigating-the-codebase.md) §17 · [docs/ops/deployment-sync-guide.md](docs/ops/deployment-sync-guide.md).
