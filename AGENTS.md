# AGENTS.md

Instructions for AI assistants and automation working in this repository (e.g. Cursor Cloud). Human-oriented setup and stack details live in [README.md](README.md).

## What this project is

**Holzen** is a React + TypeScript SPA for Bitcoin-aware mindfulness: breathing/grounding flows, journaling, a library, and AI-style companions backed by **Supabase** (Postgres, auth, Row Level Security, Edge Functions). **Stripe** is used for subscriptions via edge functions.

## Commands

| Command | Use |
|--------|-----|
| `npm run dev` | Vite dev server on **port 8080** |
| `npm run build` | Production build (**`prebuild`** → **`npm run check:version-sync`**) |
| `npm run preview` | Serve built output locally |
| `npm run test` | Vitest (jsdom), single run |
| `npm run test:ci` | CI gate: `check:edge-logging`, `check:edge-coverage-manifest`, Vitest with coverage + JUnit |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint across the repo |
| `npm run check:view-migrations` | Fail on unsafe `CREATE OR REPLACE VIEW` column renames in `supabase/migrations/` (runs in **`check:prepush`**). |
| `npm run check:edge` | Optional: `deno check` on all `supabase/functions/*/index.ts`; **skips** if Deno is missing. Resolves `deno` from PATH, then `DENO_INSTALL/bin`, then `~/.deno/bin` (official installer default). |
| `npm run check:edge-logging` | Regex guardrail: HTTP-serving edge `index.ts` files must wrap handlers in `withRequestLogging` (BetterStack + Sentry). Runs in **`test:ci`** and **`check:prepush`**. |
| `npm run check:edge-coverage-manifest` | Ensures `EdgeCoverage.tsx` lists every `supabase/config.toml` `[functions.*]` name (and no extras). Run when adding/removing edge functions. |
| `npm run check:prepush` | Full scripted preflight (`scripts/pre-push-check.sh`). **Requires `bash`** (Git Bash / WSL on Windows). |
| `npm run smoke:edge-logging` | Optional: HTTP smoke against deployed edges — verifies `x-cid` round-trip through `withRequestLogging` (see `supabase/functions/README.md`). |
| `npm run gen:types` | Regenerate `src/integrations/supabase/types.ts` from the **linked** Supabase project (`supabase login` or `SUPABASE_ACCESS_TOKEN`). Run after DB migrations. |
| `npm run test:coverage` | Vitest with coverage reports only (no JUnit; use **`test:ci`** for the full CI gate). |
| `npm run check:version-sync` | Ensures `package.json` **version** matches the latest **`changelog_entries`** row (REST); runs automatically as **`prebuild`** before **`npm run build`**. |
| `npm run stamp:release` | Writes **`git rev-parse --short=12 HEAD`** into **`supabase/functions/_shared/release.ts`** (`EDGE_RELEASE`) for edge Sentry/BetterStack **`SENTRY_RELEASE`**. Idempotent. |
| `npm run check:release-stamp` | Exits non-zero if **`EDGE_RELEASE`** in **`release.ts`** ≠ current **`git rev-parse --short=12 HEAD`** (read-only; same comparison the stamper uses). |
| `npm run dev:hosted` / `npm run dev:local` · `npm run build:dev` · `supabase:*` | Hosted vs localstack Vite modes and Docker Supabase CLI wrappers — see [README.md](README.md) npm scripts. |

**Linting:** There are many **pre-existing** ESLint issues (~300). Do not treat cleaning the whole tree as part of a small task; avoid introducing *new* problems in files you touch.

## Where to change what

| Area | Location |
|------|----------|
| Routes | `src/App.tsx` — `ProtectedRoute` / `PublicOnlyRoute`, layout vs full-screen routes; canonical path helpers in `src/lib/app-routes.ts` (`/journey/*`, `/tools/*`, legacy `/profile` redirect) |
| Page screens | `src/pages/` |
| Pause lifecycle | `src/lib/pause-state.ts` (state machine helpers), `src/lib/pause-api.ts` (typed RPC wrappers), `src/lib/pause-quality.ts` (quality score), `src/lib/pause-fingerprint.ts`, `src/lib/pause-artifact-cache.ts`. Canonical model: [docs/systems/pause-system.md](docs/systems/pause-system.md). Schema + RPCs (ordered in `supabase/migrations/`): `202604232007*_pause_*.sql`, `20260423201000_pause_rpc_functions.sql`, `20260423201100_pause_log_companion_race_fix.sql`, `20260423201200_pause_create_or_reuse_service.sql`, `20260423201300_companion_serves_pause_instance_id.sql`, `20260423201400_pause_v2_notifications_trigger.sql`, `20260423201500_pause_ai_artifacts_owner_write.sql`, `20260423202000_pause_v2_destructive_cutover.sql`. |
| Stats | `src/components/stats/` (skills-first IA post-Pause-V2). Hero: `SkillOverviewCard.tsx`. Deep dives under `src/components/stats/{regulation,tolerance,alignment,reappraisal,awareness}/`. Journey under `src/components/stats/journey/`. Advanced under `src/components/stats/advanced/`. Score: `src/lib/stats/pause-score.ts`. Confidence: `src/lib/stats/confidence.ts`. Loader: `src/hooks/use-pause-stats-data.ts`. |
| Badges | `src/components/BadgesPanelV2.tsx` (4-family / 14-active). Definitions: `src/lib/badges/definitions.ts`. Computation: `src/lib/badges/compute.ts`. Sync + celebration + silent-seed: `src/hooks/use-badge-sync.ts`. |
| Shared UI | `src/components/`; primitives in `src/components/ui/` (shadcn / Radix patterns) |
| Auth state | `src/hooks/use-auth.tsx` + `AuthProvider` in `App.tsx` |
| Supabase browser client | `src/integrations/supabase/client.ts` |
| i18n | `src/i18n/`; `useTranslation()` where strings are already externalized |
| PWA / service worker | `src/sw.ts`; registered via `vite-plugin-pwa` in `vite.config.ts` |
| Frontend error reporting | `src/lib/sentry.ts` (init + `beforeSend` scrubber); `src/components/ErrorBoundary.tsx` (React boundary); `src/main.tsx` (boot + unhandledrejection) |
| Frontend analytics + flags | `src/lib/posthog.ts` (privacy-first init); `src/hooks/use-feature-flag.ts`; events listed in [docs/ops/event-taxonomy.md](docs/ops/event-taxonomy.md); flags in [docs/ops/feature-flags.md](docs/ops/feature-flags.md) |
| Cross-surface correlation | `src/lib/cid.ts` → per-tab `cid`, attached as `x-cid` header via `invokeEdge` wrapper; set as Sentry tag + PostHog super-property |
| Web Vitals | `src/lib/web-vitals.ts` forwards CLS/INP/LCP/FCP/TTFB to Sentry + PostHog |
| Edge request logging | `supabase/functions/_shared/with-request-logging.ts` wraps new functions; `_shared/deps.ts` for external call logging; `_shared/edge-error.ts` for standardized errors |
| Edge log drain (BetterStack) | `supabase/functions/_shared/observe.ts` — `createLogger` POSTs each JSON line to `LOG_DRAIN_URL`; configure via Lovable secrets |
| Edge error reporting | `supabase/functions/_shared/sentry.ts` — `initSentryEdges` + `captureEdgeError`; wired from `withRequestLogging` catch + `observe.ts` `.error` path; no per-function init needed |
| Audit log | `supabase/functions/_shared/audit.ts` + `audit_log` table — security-sensitive ops (account deletion, admin overrides, subscription state changes) |
| Feedback widget | `src/components/FeedbackWidget.tsx` (floating button + sheet); `supabase/functions/send-feedback/index.ts` posts PII-safe summary to `SLACK_WEBHOOK_URL` |
| Health check | `supabase/functions/health/index.ts` (`verify_jwt = false`) for UptimeRobot |

**Imports:** Use the `@/` alias for `src/` (configured in `vite.config.ts` and `vitest.config.ts`).

## Supabase and edge functions

- **Migrations:** `supabase/migrations/` — SQL is the source of truth for schema; follow the project’s normal flow to apply (CLI linked project, dashboard, etc.).
- **SQL function conventions (mandatory):** every function in `supabase/migrations/` must `SET search_path = public` (or `public, extensions` when calling `net.*` / extension code), and use `SECURITY DEFINER` **only** when bypassing RLS is required — and then validate the caller and strip privileged columns. See [docs/ops/migration-security-conventions.md](docs/ops/migration-security-conventions.md) for templates and the pre-push checklist; companion rules for views are in [docs/ops/migration-view-safety.md](docs/ops/migration-view-safety.md).
- **Edge functions:** `supabase/functions/<name>/index.ts` (Deno). Shared helpers: `supabase/functions/_shared/`. Larger handlers (e.g. **`companion-orchestrate`**) also use **`_shared/companion-orchestrate-*.ts`** (types, parse, logging, skip-cache, tasks, assemble). Add **`[functions.<name>]`** in **`supabase/config.toml`** for **every** new function (same PR). Unlisted names use **Supabase defaults** and can **401** on `invoke` or disagree with `functions serve` until you add the block and redeploy. **401** → session/`Authorization`, dashboard secrets, deployed `config.toml`. After editing edge TS, run **`npm run check:edge`** when Deno is installed.
- **Lovable + GitHub sync:** migrations and edge functions often **deploy to the linked project immediately** on sync; the **React app** still needs a **publish / Update** in Lovable. See [docs/fundamentals/navigating-the-codebase.md](docs/fundamentals/navigating-the-codebase.md) §17.
- **Runtime:** Functions run on Supabase in deployed environments. You typically **do not** start them locally during ordinary frontend work unless you are explicitly developing/testing a function.
- **Secrets** (Stripe, Lovable email/AI keys, VAPID, model keys, etc.) belong in the **Supabase dashboard** for edge functions — not in `VITE_*` or committed files.

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

**Run the pre-push checklist** in [docs/ops/deployment-sync-guide.md](docs/ops/deployment-sync-guide.md) (boxed list + **`npm run check:prepush`** bash gate). Day-to-day minimum: **`npm run test`**, **`npm run build`** (**`prebuild`** → **`check:version-sync`**), lint on touched files. When edge code or **`config.toml`** / **`EdgeCoverage.tsx`** changes: also **`npm run check:edge`** (if Deno is installed), **`npm run check:edge-logging`**, **`npm run check:edge-coverage-manifest`**. After schema changes: **`npm run gen:types`** when you can authenticate to Supabase, and **`as unknown as T`** for new columns until types catch up. Cursor loads the same expectations via `.cursor/rules/deployment-sync.mdc`.

## Observability

- **Frontend errors → Sentry** with on-error Session Replay (fully masked: `maskAllText`, `blockAllMedia`, `maskAllInputs`). Tracing sample rate 0.1. No global Replay.
- **Edge errors → Sentry** via `supabase/functions/_shared/sentry.ts` (shared helper, no per-function init). Captured from `withRequestLogging` catch and `observe.ts` `.error` path. `tracesSampleRate: 0`, no Replay. `beforeSend` skips expected `EdgeError` codes (`auth_required`, `rate_limited`, `bad_input`, `not_found`) to protect quota.
- **Structured edge logs → BetterStack** via `observe.ts` in-function HTTP forwarder (Lovable-managed Supabase has no dashboard log drain).
- **Product analytics + feature flags → PostHog** with `autocapture: false`, `session_recording.disabled: true`, `person_profiles: 'identified_only'`, `sanitize_properties`.
- **Alerts → Slack (`#holzen-alerts`)** from Sentry + BetterStack + UptimeRobot + the feedback forwarder.
- **Cron heartbeats → BetterStack Heartbeats** via `net.http_get` inside each `pg_cron` schedule.
- **Correlation ID (`cid`)**: per-tab UUID generated in `src/lib/cid.ts`, sent as `x-cid` header on every `supabase.functions.invoke()`; pivoted in Sentry (tag), PostHog (super-property), BetterStack (field), Postgres (`audit_log.cid`).
- **Release tagging**: `VITE_APP_VERSION` (frontend) and `SENTRY_RELEASE` (edges) must match — both Git SHA.
- **Runbooks**:
  - [docs/ops/observability-setup.md](docs/ops/observability-setup.md) — the setup bible (DSNs, webhooks, alert rules, heartbeats).
  - [docs/ops/incident-response.md](docs/ops/incident-response.md) — Slack-first triage flow.
  - [docs/ops/pii-masking-review.md](docs/ops/pii-masking-review.md) — PR checklist for Sentry + PostHog + edge logs + Slack.
  - [docs/ops/event-taxonomy.md](docs/ops/event-taxonomy.md) — PostHog events + properties.
  - [docs/ops/feature-flags.md](docs/ops/feature-flags.md) — active flags + sunset triggers.
  - [docs/ops/edge-logging-conventions.md](docs/ops/edge-logging-conventions.md) — `withRequestLogging`, `logDependencyCall`, `EdgeError`, `logAudit`.
  - [docs/ops/backup-restore-drill.md](docs/ops/backup-restore-drill.md) — quarterly restore drill.

## Related docs

- [docs/README.md](docs/README.md) — full docs index, **start-here** reading order, and **canonical sources** (what to edit when docs drift).
- [docs/fundamentals/http-review-playbooks.md](docs/fundamentals/http-review-playbooks.md) — Postman/Bruno step-by-step API review; [bruno/](bruno/) collection, [bruno/SCOPE.md](bruno/SCOPE.md), [bruno/functions-catalog.md](bruno/functions-catalog.md).
- [docs/ops/logging-strategy.md](docs/ops/logging-strategy.md) — edge vs browser logging, `observe.ts`, correlation IDs.
- [README.md](README.md) — clone/setup, scripts, high-level layout.
- [docs/architecture/c4-holzen.md](docs/architecture/c4-holzen.md) — C4 System Context + Container diagrams ([workspace.dsl](docs/architecture/workspace.dsl) for Structurizr).
- [`.env.example`](.env.example) — template env vars.

**Scope of this file:** quick commands and “where to change what.” Longer boot flow, architecture narratives, and per-subsystem behavior live under `docs/` — link there instead of duplicating.
