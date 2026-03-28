# AGENTS.md

Instructions for AI assistants and automation working in this repository (e.g. Cursor Cloud). Human-oriented setup and stack details live in [README.md](README.md).

## What this project is

**Holzen** is a React + TypeScript SPA for Bitcoin-aware mindfulness: breathing/grounding flows, journaling, a library, and AI-style companions backed by **Supabase** (Postgres, auth, Row Level Security, Edge Functions). **Stripe** is used for subscriptions via edge functions.

## Commands

| Command | Use |
|--------|-----|
| `npm run dev` | Vite dev server on **port 8080** |
| `npm run build` | Production build |
| `npm run preview` | Serve built output locally |
| `npm run test` | Vitest (jsdom), single run |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint across the repo |

**Linting:** There are many **pre-existing** ESLint issues (~300). Do not treat cleaning the whole tree as part of a small task; avoid introducing *new* problems in files you touch.

## Where to change what

| Area | Location |
|------|----------|
| Routes | `src/App.tsx` — `ProtectedRoute` / `PublicOnlyRoute`, layout vs full-screen routes |
| Page screens | `src/pages/` |
| Shared UI | `src/components/`; primitives in `src/components/ui/` (shadcn / Radix patterns) |
| Auth state | `src/hooks/use-auth.tsx` + `AuthProvider` in `App.tsx` |
| Supabase browser client | `src/integrations/supabase/client.ts` |
| i18n | `src/i18n/`; `useTranslation()` where strings are already externalized |
| PWA / service worker | `src/sw.ts`; registered via `vite-plugin-pwa` in `vite.config.ts` |

**Imports:** Use the `@/` alias for `src/` (configured in `vite.config.ts` and `vitest.config.ts`).

## Supabase and edge functions

- **Migrations:** `supabase/migrations/` — SQL is the source of truth for schema; follow the project’s normal flow to apply (CLI linked project, dashboard, etc.).
- **Edge functions:** `supabase/functions/<name>/index.ts` (Deno). Shared helpers: `supabase/functions/_shared/`. **`supabase/config.toml`** only overrides **named** functions; others use **Supabase defaults** (often `verify_jwt` on for browser `invoke`). Add a `[functions.<name>]` block when you need explicit JWT behavior. **401 on invoke** → check session header, dashboard secrets, and whether that function is listed in `config.toml`.
- **Lovable + GitHub sync:** migrations and edge functions often **deploy to the linked project immediately** on sync; the **React app** still needs a **publish / Update** in Lovable. See [docs/navigating-the-codebase.md](docs/navigating-the-codebase.md) §17.
- **Runtime:** Functions run on Supabase in deployed environments. You typically **do not** start them locally during ordinary frontend work unless you are explicitly developing/testing a function.
- **Secrets** (Stripe, Resend, VAPID, model keys, etc.) belong in the **Supabase dashboard** for edge functions — not in `VITE_*` or committed files.

## Environment variables

- **Required for a custom project:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example` and `src/integrations/supabase/client.ts`).
- **Optional:** `VITE_ADMIN_USER_IDS` — comma-separated auth user UUIDs allowed to use `/admin`.
- `vite.config.ts` uses `loadEnv` and may supply **fallback** Supabase URL/key when vars are missing so dev can boot; prefer explicit `.env` for forks and CI.

Never commit `.env` or service role keys.

## Conventions for edits

- Match existing patterns in the nearest sibling files (hooks, forms with React Hook Form + Zod, TanStack Query for server state).
- Prefer extending existing components over duplicating UI logic.
- User-visible copy: follow existing **i18n** usage in the same feature; do not hardcode English in places that already use `t('...')` without a good reason.
- **Scope:** Make minimal, task-focused diffs; avoid drive-by refactors and unrelated formatting sweeps.

## Git

- **Commit as you go** when a logical chunk of work is done (e.g. one fix, one migration, one doc update)—do not leave the tree dirty at the end of a task unless the user asked for WIP only.
- Use clear commit messages (what changed and why). Prefer `git` from the system install if it is not on `PATH` (e.g. `C:\Program Files\Git\bin\git.exe` on Windows).

## Related docs

- [README.md](README.md) — clone/setup, scripts, high-level layout.
- [`.env.example`](.env.example) — template env vars.
