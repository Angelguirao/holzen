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

Copy environment variables and adjust for your Supabase project (or your team’s shared values):

```sh
cp .env.example .env
```

See [.env.example](.env.example). The app reads **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_PUBLISHABLE_KEY`** (see `src/integrations/supabase/client.ts`). Optional **`VITE_ADMIN_USER_IDS`**: comma-separated Supabase user UUIDs that may access `/admin`. `VITE_SUPABASE_PROJECT_ID` in the example file is for your own reference when matching the dashboard project.

Start the dev server (Vite is configured for **port 8080**):

```sh
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). You do **not** need a local database or Docker for everyday frontend work; the app talks to the hosted Supabase project.

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Vitest (jsdom), single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint |

## Repository layout

- **`src/`** — Application code. Import alias **`@`** maps to `./src` (see `vite.config.ts` and `vitest.config.ts`).
- **`src/pages/`** — Route-level screens (home, library, practices, settings, blog, admin, etc.); routing is defined in `src/App.tsx`.
- **`src/components/`** — Shared UI, including `components/ui` (shadcn-style primitives).
- **`supabase/migrations/`** — SQL migrations for the hosted database.
- **`supabase/functions/`** — Edge functions (Deno): checkout, subscriptions, notifications, AI companions, journaling helpers, and related HTTP APIs. They run on Supabase in production; **secrets** (Stripe, Resend, VAPID, etc.) are configured in the Supabase dashboard, not in the frontend `.env`.
- **`public/`** — Static assets served as-is.

## Supabase & backend

- **Schema changes**: apply migrations with your usual Supabase workflow (e.g. linked project + `supabase db push`, or dashboard SQL). Migrations in this repo are the source of truth for the database shape.
- **Edge functions**: each folder under `supabase/functions/<name>/` is a deployable function; shared code lives in `supabase/functions/_shared/`.
- **Local frontend only**: the publishable Supabase key in `.env` is safe for the browser; never commit server keys or edge secrets to the repo.

## PWA & offline

The app registers a custom service worker from `src/sw.ts` for installability and caching behavior. Behavior may differ between development and production builds.

## Linting & tests

ESLint is enabled project-wide. The tree may report many existing issues; treat new changes as the bar for cleanliness. Tests use Vitest with Testing Library where present.

## Lovable

The project was initially scaffolded with [Lovable](https://lovable.dev); you can keep using that workflow alongside local development. Publishing and custom domains are documented in [Lovable’s docs](https://docs.lovable.dev/features/custom-domain#custom-domain).
