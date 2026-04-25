# Holzen Docs Index

This folder contains human-readable notes that complement the source code and in-repo reference docs.

## Start here (new contributors)

1. **[architecture/c4-holzen.md](architecture/c4-holzen.md)** — who the system talks to (System Context + Container). Optional: [workspace.dsl](architecture/workspace.dsl) in Structurizr.
2. **[fundamentals/navigating-the-codebase.md](fundamentals/navigating-the-codebase.md)** — boot flow, routing, auth, hooks, and how Supabase pieces connect at runtime. **§19** — phased **learning path** (pause slice first, then whole app).
3. **Optional — [fundamentals/mental-models-for-contributors.md](fundamentals/mental-models-for-contributors.md)** — plain-language glossary, SPA/React/Supabase mental models, and suggested external primers if you’re coming from a backend-heavy background.
4. **Your vertical slice** — pick one area below (e.g. [systems/routing/route-gating-system.md](systems/routing/route-gating-system.md) or [systems/pause-system.md](systems/pause-system.md)) and read the phased [reviews/](reviews/) docs in order when you need depth on security and pipelines.

[AGENTS.md](../AGENTS.md) at the repo root is the **quick reference** for commands and “where to change what” (optimized for automation and fast lookup). This index is the **full map**.

## Canonical sources (avoid drift)

| Kind of information | Authoritative place | Notes |
|---------------------|---------------------|--------|
| Commands, env vars, “where to edit” table | [AGENTS.md](../AGENTS.md) | Keep tables here; link out for narratives. |
| Supabase **`Database` types** (`src/integrations/supabase/types.ts`) | [AGENTS.md](../AGENTS.md) (`npm run gen:types`) | Regenerate after migrations; if types lag, use `as unknown as T` per [deployment-sync-guide.md](ops/deployment-sync-guide.md). |
| Boot sequence, repo tour, Lovable vs local | [fundamentals/navigating-the-codebase.md](fundamentals/navigating-the-codebase.md) | Do not duplicate long boot narratives in AGENTS. |
| Pause lifecycle (instances, events, artifacts, state machine) | [systems/pause-system.md](systems/pause-system.md) | Canonical **data model** and invariants (Pause V2). |
| Pause AI pipeline (triggers, edge functions, generators, storage, hooks) | [systems/pause/ai-powered-pause-system.md](systems/pause/ai-powered-pause-system.md) | **Current** Pause V2 pipeline narrative; complements `pause-system.md` (starts with a V2 banner — not a pre‑V2 archive). |
| How a subsystem behaves (contracts, flows) | [systems/](systems/) | One primary doc per concern; cross-link related systems. |
| Irreversible or costly-to-reverse choices | [decisions/](decisions/) | Short ADR-style notes; see [decisions/README.md](decisions/README.md). |
| Incidents, invariants, “why we hardened X” | [postmortems/](postmortems/) | |
| What to watch when things break (cron, retries, logs) | [ops/](ops/) | [ops/observability-and-failures.md](ops/observability-and-failures.md) is the checklist index; [ops/logging-strategy.md](ops/logging-strategy.md) defines logging conventions. |
| Step-by-step HTTP review (Postman / Bruno) | [fundamentals/http-review-playbooks.md](fundamentals/http-review-playbooks.md) | Optional [bruno/](../bruno/) folder for git-friendly collections. |
| Design system migration (Nox) | [design/nox/](design/nox/) | Figma is canonical for visual values; markdown owns migration rules, mapping, and extension policy. |
| **Live browser 360°** (MCP: network, console, Lighthouse, performance) | [fundamentals/browser-360-mcp-playbook.md](fundamentals/browser-360-mcp-playbook.md) | Pairs with source reading; optional snapshot reports under [reports/](reports/). |
| **UI / journeys** (click-through flows in the real app) | [backlog/e2e-browser-automation.md](backlog/e2e-browser-automation.md) | **Not** a substitute for HTTP review: use **Playwright**, **Cypress**, or **Vitest + React Testing Library** for full product flows; Bruno is for **API** review only. |

When you change behavior, update the **one** doc that owns that slice (and ADRs only when the *decision* changes, not every refactor).

## Architecture (C4)

- `architecture/README.md` — index for **C4** context + container views  
- `architecture/c4-holzen.md` — Mermaid diagrams (System Context, Container)  
- `architecture/workspace.dsl` — **Structurizr** workspace (same model; use Lite or CLI to render)

## Fundamentals

- `fundamentals/navigating-the-codebase.md` — repo tour: boot flow, routing, auth, hooks, Supabase basics.
- `fundamentals/refactoring-strategy.md` — incremental split of large pages/hooks (`src/lib` vs components); pairs with [backlog/react-page-and-hook-splitting.md](backlog/react-page-and-hook-splitting.md).
- `fundamentals/mental-models-for-contributors.md` — glossary + vocabulary for SPAs, React, TypeScript, Vite, Supabase (RLS, edge functions); links to official docs and learning resources.
- `fundamentals/codebase-size-and-review-practices.md` — codebase size snapshot and review best-practices.
- `fundamentals/http-review-playbooks.md` — step-by-step Postman/Bruno flows, Supabase `invoke` headers, pairing with Edge logs; [bruno/](../bruno/) collection, [bruno/SCOPE.md](../bruno/SCOPE.md) (HTTP vs full app), [bruno/functions-catalog.md](../bruno/functions-catalog.md) (full **`config.toml`** name list + Bruno smoke subset).
- `fundamentals/browser-360-mcp-playbook.md` — Chrome DevTools MCP: network, console, Lighthouse, performance traces; complements HTTP playbooks and source reading.
- **UI / journeys vs API review:** full app flows (pause, journal, settings) belong in browser automation — see [backlog/e2e-browser-automation.md](backlog/e2e-browser-automation.md). Bruno/Postman stay on the HTTP side; they do not replace E2E.

## Reports (snapshots)

- `reports/2026-04-03-home-localhost-360-analysis.md` — example **360°** capture for **`/`** on localhost (Lighthouse + trace + backlog pointers).

## Decisions (light ADRs)

- `decisions/README.md` — when to add a decision record and a minimal template.

## Ops

- `ops/deployment-sync-guide.md` — **GitHub ↔ Lovable sync**: what auto-deploys, safe workflow, pre-push checklist, **`npm run check:prepush`** (bash full gate), and troubleshooting (401s, migration failures, stale deploys, CRON_SECRET mismatches).
- `ops/cron-setup.md` — scheduled jobs: pg_cron + `net.http_post` callouts for pause-adjacent workers.
- `ops/logging-strategy.md` — edge vs browser vs DB logging; `observe.ts` patterns; correlation and PII.
- `ops/versioning.md` — canonical version policy: changelog version vs build/release ID vs `package.json` metadata.
- `ops/pause-signal-companion-logging-e2e.md` — strategic goals + manual steps to trace pause → Signal (`holzen:companion` + `companion_slot_resolved`).
- `ops/observability-and-failures.md` — where to record logs, retries, and failure modes per pipeline (checklist; links into systems and postmortems).
- `ops/migration-security-conventions.md` — required `SECURITY DEFINER` + `search_path` conventions for every function in `supabase/migrations/`.
- `ops/migration-view-safety.md` — when `CREATE OR REPLACE VIEW` is unsafe; use `DROP VIEW IF EXISTS … CREATE VIEW …`.

## Backlog

- `backlog/backlog.md` — pending improvements; **work queue (pick by goal)**, master table, quick finder by theme, alphabetical index. Individual tickets under `backlog/*.md` (includes **frontend structure** items: typed navigation state, page/hook splits, data-fetching conventions, Lighthouse a11y, preconnect, Recharts). Browser **360°** methodology: [fundamentals/browser-360-mcp-playbook.md](fundamentals/browser-360-mcp-playbook.md).
- `backlog/e2e-browser-automation.md` — **UI / journeys** (click-through pause, journal, settings): Playwright/Cypress or Vitest+RTL — not Bruno; see [bruno/SCOPE.md](../bruno/SCOPE.md) for HTTP vs full app.

## Reviews

- `reviews/full-app-review-backlog.md` — **inventory of all flows** with hour estimates and sequencing (beyond pause-first phases)
- `reviews/phase-1-frontend-routing-auth.md` — onboarding review for frontend auth + routing contracts
- `reviews/phase-2-manual-pause-pipeline.md` — manual pause producer/client processing review
- `reviews/phase-3-server-cron-triggers.md` — server cron trigger review (check-volatility)
- `reviews/phase-4-cron-workers-caching.md` — cron workers + caching lifecycle review
- `reviews/phase-5-quality-gates-rate-limit-cache.md` — quality gates, rate limiting, and cache logic review
- `reviews/phase-6-rls-authz-security-model.md` — RLS/authz security model review
- `reviews/phase-7-edge-function-auth-correctness.md` — edge function auth correctness review
- `reviews/phase-8-rls-hardening-service-role-policies.md` — service-role hardening policies review

## Systems

- `systems/auth/auth-and-referral-system.md` — Auth system (Supabase) + optional referral side-effect
- `systems/routing/route-gating-system.md` — protected vs public-only vs ungated routes; `ProtectedRoute` / `PublicOnlyRoute` contracts
- `systems/pause-system.md` — end-to-end architecture of the Pause V2 lifecycle (instances, events, artifacts, stats, badges).
- `systems/pause/ai-powered-pause-system.md` — Pause V2 **AI and edge** pipeline (triggers, `holzen-reflect`, `companion-orchestrate`, generators, cron); narrative companion to `pause-system.md`.
- `systems/costs/ai-cost-model.md` — **canonical** cost + guardrail reference. All AI-powered edge functions, cost ceilings, panic mode, feature flags, scenario modeling, runbooks, auto-top-up.
- `systems/pause/pause-session-cost-estimates.md` — pause-flow case study. Defer to `systems/costs/ai-cost-model.md` for anything cross-feature.
- `systems/pause/companions/` — deep dives per companion type (see [companions/signal.md](systems/pause/companions/signal.md) for Signal).
- `systems/pause/past-reflections.md` — shared "user words" read model behind Zoom Out's Echo and Daily Practice Replay (notes + replay entries, never AI text).
- `systems/content-library-fetch-source-feeds.md` — **`fetch-source-feeds`** pipeline: RSS/Map discovery → scrape → Gemini → `content_library`; admin setup and **JSON** log grep tokens (`fn`, **`fetch_feeds_*`** **`msg`**).
- `systems/stats-system.md` — current Profile > Stats reference in UI order, plus a recommended skills-first target model.
- `systems/badges-system.md` — current Profile > Badges reference in UI order, plus a recommended skills-aligned target model.

## Postmortems

- `postmortems/holzen-postmortem-invariants.md` — core invariants and the "why" behind key codebase hardening
