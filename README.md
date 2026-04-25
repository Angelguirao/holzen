# Holzen

Holzen is a React + TypeScript single-page app focused on **Bitcoin-aware mindfulness**: breathing and grounding practices, journaling, a content library, and companions powered by Supabase edge functions.

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

Environment variables (see [.env.example](.env.example)):

- **Lovable Cloud only:** Preview/builds may get `VITE_SUPABASE_*` from Lovable, or rely on the **hosted fallbacks** in `vite.config.ts` when vars are unset (same as local `vite build`). You do not maintain a `.env` file in the Lovable UI for the default Holzen backend.
- **Default (local machine):** `cp .env.example .env` then `npm run dev` — uses your `.env` values. If `VITE_SUPABASE_*` are missing, **dev and `npm run build`** can fall back to the bundled Holzen hosted keys in `vite.config.ts` (never in `localstack` mode). Set real `VITE_SUPABASE_*` for another Supabase project or if you do not want those defaults in the bundle.
- **Two files / two backends (optional on your machine):** Lovable Cloud does **not** read `.env.hosted`; that file is only for **`npm run dev:hosted`** when you want the app on your laptop to use **hosted** Supabase. If you **only** develop against **local Docker** Supabase, use **`.env.localstack`** / **`npm run dev:local`** and you can **ignore** `.env.hosted` entirely.
  - **Hosted from local Vite:** copy [.env.hosted.example](.env.hosted.example) to **`.env.hosted.local`**, fill in URL + anon key, run **`npm run dev:hosted`**.
  - **Local Docker only:** copy [.env.localstack.example](.env.localstack.example) to **`.env.localstack.local`**, set the anon key from `npm run supabase:status`, run **`npm run dev:local`** (no hosted URL/key fallback for that mode).

The app reads **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_PUBLISHABLE_KEY`**. **`VITE_ADMIN_USER_IDS`** is optional (comma-separated auth user UUIDs); admin access may also be governed in the database (e.g. `is_admin` / `is_admin()`) depending on your setup.

Start the dev server (Vite is configured for **port 8080**):

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). For hosted Supabase you do **not** need Docker for everyday frontend work.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR (default mode) |
| `npm run dev:hosted` | Dev server using `.env.hosted` / `.env.hosted.local` (optional: hit **cloud** Supabase from your PC; not used by Lovable) |
| `npm run dev:local` | Dev server using `.env.localstack` / `.env.localstack.local` (local Supabase only; no hosted fallback) |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (jsdom), single run |
| `npm run test:ci` | `check:edge-logging` + `check:edge-coverage-manifest` + Vitest with coverage and JUnit output (CI-style gate) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |
| `npm run check:view-migrations` | Fail if a migration uses unsafe `CREATE OR REPLACE VIEW` renames (also run from `check:prepush`) |
| `npm run supabase:start` | Local Supabase stack (Docker); same as `npx supabase start` |
| `npm run supabase:status` | Print local API URL and anon key |
| `npm run supabase:stop` | Stop local stack |
| `npm run supabase:reset` | Reapply `supabase/migrations/` on local DB |
| `npm run gen:types` | Regenerate `src/integrations/supabase/types.ts` from the **linked** project (`supabase login` or `SUPABASE_ACCESS_TOKEN`) |
| `npm run check:edge-logging` | Fail if an edge function serves HTTP without `withRequestLogging` (runs in `test:ci` / `check:prepush`) |
| `npm run check:edge-coverage-manifest` | Fail if `EdgeCoverage.tsx` is missing any `supabase/config.toml` edge function name (runs in `test:ci` / `check:prepush`) |
| `npm run check:edge` | Optional **Deno** typecheck of every `supabase/functions/*/index.ts`; **no-op** if `deno` is not installed |
| `npm run check:prepush` | Full bash preflight (`scripts/pre-push-check.sh`); use **Git Bash** or **WSL** on Windows |
| `npm run smoke:edge-logging` | Optional live HTTP probe of edge `x-cid` behavior (see `supabase/functions/README.md`) |
| `npm run test:coverage` | Vitest with coverage (no JUnit; use **`test:ci`** for logging guards + JUnit) |
| `npm run check:version-sync` | `package.json` version vs latest `changelog_entries` (runs automatically as **`prebuild`** on **`npm run build`**) |
| `npm run stamp:release` | Refresh **`supabase/functions/_shared/release.ts`** with the current Git SHA for edge observability releases |
| `npm run check:release-stamp` | Verify **`release.ts`** matches `HEAD` without writing |

## Repository layout

- **`src/`** — Application code. Import alias **`@`** maps to `./src` (see `vite.config.ts` and `vitest.config.ts`).
- **`src/pages/`** — Route-level screens (home, library, practices, settings, blog, admin, etc.); routing is defined in `src/App.tsx`.
- **`src/components/`** — Shared UI, including `components/ui` (shadcn-style primitives).
- **`supabase/migrations/`** — SQL migrations for the hosted database.
- **`supabase/functions/`** — Edge functions (Deno): checkout, subscriptions, notifications, AI companions, journaling helpers, and related HTTP APIs. They run on Supabase in production; **secrets** (Stripe, Lovable email/AI keys, VAPID, etc.) are configured in the Supabase dashboard, not in the frontend `.env`.
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

**Edge functions:** You can run functions locally with `npx supabase functions serve`, but production behavior depends on **Supabase dashboard secrets** (Stripe, email, AI keys, etc.). Local testing may need those set for the CLI or a `.env` used by `supabase functions serve`—see [Supabase Functions local secrets](https://supabase.com/docs/guides/functions/secrets).

**No Docker:** Use a separate hosted project (staging), put its URL and anon key in `.env`, and apply migrations there before production.

## PWA & offline

The app registers a custom service worker from `src/sw.ts` for installability and caching behavior. Behavior may differ between development and production builds.

## Linting & tests

ESLint is enabled project-wide. The tree may report many existing issues; treat new changes as the bar for cleanliness. Tests use Vitest with Testing Library where present.

**Production builds** run **`npm run check:version-sync`** first (`prebuild` hook) so **`package.json` `version`** stays aligned with the latest **`changelog_entries`** row for the configured Supabase project.

**Edge functions:** After changing `supabase/functions/**/*.ts`, run **`npm run check:edge`** if you have [Deno](https://deno.land/) on your `PATH` — it runs `deno check` on each function’s `index.ts`. If Deno is missing, the script exits successfully and prints a skip message (so CI can call it without installing Deno unless you want stricter checks). Before shipping edge changes, ensure **`npm run stamp:release`** has been run (or run **`npm run check:prepush`**, which stamps and warns if **`release.ts`** drifted).

## Lovable

The project was initially scaffolded with [Lovable](https://lovable.dev); you can keep using that workflow alongside local development. **Lovable Cloud** can generate and manage **`VITE_SUPABASE_*` for previews and deploys** so you do not hand-edit `.env` in that environment. **Locally**, Git + Vite still use `.env` / `.env.*.local` on your machine when you run `npm run dev` (or the `dev:hosted` / `dev:local` scripts above). Publishing and custom domains are documented in [Lovable’s docs](https://docs.lovable.dev/features/custom-domain#custom-domain).

**When the repo syncs from GitHub into Lovable**, the linked Supabase project typically **applies new migrations and deploys edge function changes automatically** — that can affect **production** immediately, with no extra click. **Frontend** (this React app) still goes live for end users when you **publish** and confirm **Update** in Lovable’s publish flow. Merge backend changes with that split in mind; see [docs/fundamentals/navigating-the-codebase.md](docs/fundamentals/navigating-the-codebase.md) for `config.toml`, JWT defaults, and local vs hosted behavior.
