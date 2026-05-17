# `src/` — shipped pause-first surface

Active Holzen frontend. **Pause ritual** is the product; Archive, Journey overview, and Settings support it.

## Shipped routes (shell)

| Tab / area | Path | Entry |
| ---------- | ---- | ----- |
| Home | `/` | `pages/Home.tsx` |
| Archive | `/archive` | `pages/Archive.tsx` |
| Journey | `/journey` | `pages/journey/JourneyOverview.tsx` |
| Settings | `/settings/*` | `pages/settings/` |
| Pause | `/pause` | `pages/PauseSession.tsx` |
| Public | `/welcome`, `/auth`, `/roadmap`, legal, blog | `pages/` |

Dead IA (`/tools/*`, `/library`, `/journey/stats`, …) → `NotFound` (no legacy redirects).

## Where to look

| Concern | Location |
| ------- | -------- |
| Router | `App.tsx`, `lib/app-routes.ts` |
| Pause lifecycle | `lib/pause-*.ts`, `components/pause/` |
| Subscription | `hooks/use-subscription.ts`, §5.4 in launch plan |
| Legacy full IA | [`legacy/README.md`](legacy/README.md) — **not imported** |
| i18n | Shipped: `locales/en.json` only; archived langs in `legacy/locales/` |

## Architecture

- [`docs/fundamentals/holzen-application-architecture.md`](../docs/fundamentals/holzen-application-architecture.md) — principles (bounded contexts, use cases, ports).
- [`docs/fundamentals/frontend-module-layout.md`](../docs/fundamentals/frontend-module-layout.md) — target monorepo tree and migration waves.
- [`docs/decisions/2026-05-17-modular-monolith-hexagonal-client.md`](../docs/decisions/2026-05-17-modular-monolith-hexagonal-client.md) — accepted ADR.
- [`docs/fundamentals/modern-react-practices-holzen.md`](../docs/fundamentals/modern-react-practices-holzen.md) — industry React norms vs Holzen (scorecard).

Read before large `src/` restructures.

## Manifest

[`docs/ops/active-surface.md`](../docs/ops/active-surface.md) — routes, edges, crons, tables, events (canonical).

## Agents

Read `.cursor/rules/active-surface.mdc` and `docs/ops/active-surface.md` before non-trivial edits. Never import from `@/legacy/*`.
