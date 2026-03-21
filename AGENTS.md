# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Holzen is a React + TypeScript SPA (single-page application) for Bitcoin mindfulness. It uses Vite for dev/build, Supabase as the hosted backend (auth, DB, edge functions), and Stripe for payments.

### Running the app

- **Dev server**: `npm run dev` — starts Vite on port 8080
- **Build**: `npm run build`
- **Lint**: `npm run lint` (ESLint; the codebase has ~300 pre-existing lint errors — these are not regressions)
- **Tests**: `npm run test` (Vitest with jsdom)

### Architecture notes

- The `.env` file contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` pointing to the hosted Supabase project. No local database or Docker is needed.
- Supabase edge functions (in `supabase/functions/`) run on Supabase's cloud; they are not started locally during normal development.
- Third-party API keys (Stripe, Lovable AI, Resend, VAPID) are configured as secrets on the Supabase edge functions — they are not needed for local frontend development.
- The app is a PWA with Workbox via `vite-plugin-pwa`. The service worker source is `src/sw.ts`.
- Path alias `@` maps to `./src` (configured in both `vite.config.ts` and `vitest.config.ts`).
