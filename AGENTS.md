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
| `npm run check:edge` | Optional: `deno check` on all `supabase/functions/*/index.ts`; **skips** if Deno is missing. Resolves `deno` from PATH, then `DENO_INSTALL/bin`, then `~/.deno/bin` (official installer default). |

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
- **Edge functions:** `supabase/functions/<name>/index.ts` (Deno). Shared helpers: `supabase/functions/_shared/`. Larger handlers (e.g. **`companion-orchestrate`**) also use **`_shared/companion-orchestrate-*.ts`** (types, parse, logging, skip-cache, tasks, assemble). Add **`[functions.<name>]`** in **`supabase/config.toml`** for **every** new function (same PR). Unlisted names use **Supabase defaults** and can **401** on `invoke` or disagree with `functions serve` until you add the block and redeploy. **401** → session/`Authorization`, dashboard secrets, deployed `config.toml`. After editing edge TS, run **`npm run check:edge`** when Deno is installed.
- **Lovable + GitHub sync:** migrations and edge functions often **deploy to the linked project immediately** on sync; the **React app** still needs a **publish / Update** in Lovable. See [docs/fundamentals/navigating-the-codebase.md](docs/fundamentals/navigating-the-codebase.md) §17.
- **Runtime:** Functions run on Supabase in deployed environments. You typically **do not** start them locally during ordinary frontend work unless you are explicitly developing/testing a function.
- **Secrets** (Stripe, Resend, VAPID, model keys, etc.) belong in the **Supabase dashboard** for edge functions — not in `VITE_*` or committed files.

## Environment variables

- **Required for a custom project:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example` and `src/integrations/supabase/client.ts`).
- **Optional:** `VITE_ADMIN_USER_IDS` — comma-separated auth user UUIDs allowed to use `/admin`.
- `vite.config.ts` uses `loadEnv`; when `VITE_*` are missing and mode is not `localstack`, **dev server and `vite build`** may inject Holzen hosted Supabase URL/key (see `vite.config.ts`). Set `VITE_SUPABASE_*` explicitly for another project or stricter CI.

Never commit `.env` or service role keys.

## Conventions for edits

- Match existing patterns in the nearest sibling files (hooks, forms with React Hook Form + Zod, TanStack Query for server state).
- Prefer extending existing components over duplicating UI logic.
- User-visible copy: follow existing **i18n** usage in the same feature; do not hardcode English in places that already use `t('...')` without a good reason.
- **Scope:** Make minimal, task-focused diffs; avoid drive-by refactors and unrelated formatting sweeps.

## Git

- **Commit as you go** when a logical chunk of work is done (e.g. one fix, one migration, one doc update)—do not leave the tree dirty at the end of a task unless the user asked for WIP only.
- Use clear commit messages (what changed and why). Prefer `git` from the system install if it is not on `PATH` (e.g. `C:\Program Files\Git\bin\git.exe` on Windows).

### Before every push to GitHub (Lovable sync)

Pushing triggers **automatic** DB migrations and edge function deploys to the linked project; the **frontend** still needs a manual **Publish → Update** in Lovable.

**Run the pre-push checklist** in [docs/ops/deployment-sync-guide.md](docs/ops/deployment-sync-guide.md) (tests, `npm run build`, lint on changed files, `npm run check:edge`, new `config.toml` entries, secrets, migration order, `as unknown as T` for new columns). Cursor loads the same expectations via `.cursor/rules/deployment-sync.mdc`.

## Related docs

- [docs/README.md](docs/README.md) — full docs index, **start-here** reading order, and **canonical sources** (what to edit when docs drift).
- [docs/fundamentals/http-review-playbooks.md](docs/fundamentals/http-review-playbooks.md) — Postman/Bruno step-by-step API review; [bruno/](bruno/) collection, [bruno/SCOPE.md](bruno/SCOPE.md), [bruno/functions-catalog.md](bruno/functions-catalog.md).
- [docs/ops/logging-strategy.md](docs/ops/logging-strategy.md) — edge vs browser logging, `observe.ts`, correlation IDs.
- [README.md](README.md) — clone/setup, scripts, high-level layout.
- [docs/architecture/c4-holzen.md](docs/architecture/c4-holzen.md) — C4 System Context + Container diagrams ([workspace.dsl](docs/architecture/workspace.dsl) for Structurizr).
- [`.env.example`](.env.example) — template env vars.

**Scope of this file:** quick commands and “where to change what.” Longer boot flow, architecture narratives, and per-subsystem behavior live under `docs/` — link there instead of duplicating.
