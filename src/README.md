# `src/` — shipped pause-first surface

Active Holzen frontend. **Pause ritual** is the product; Archive, Journey overview, and Settings support it.

## Shipped routes (shell)

| Tab / area | Path | Screen entry |
| ---------- | ---- | ------------- |
| Home | `/` | `screens/home/HomeScreen.tsx` |
| Archive | `/archive` | `screens/archive/ArchiveScreen.tsx` |
| Journey | `/journey` | `screens/journey/JourneyOverviewScreen.tsx` |
| Settings | `/settings/*` | `screens/settings/*` |
| Pause | `/pause`, `/companion/*` | `screens/pause/` |
| Public | `/welcome`, `/auth`, legal, blog | `screens/marketing/*Screen` |

Dead IA (`/tools/*`, `/library`, `/journey/stats`, …) → `NotFound` (no legacy redirects).

## Where to look

| Concern | Location |
| ------- | -------- |
| Router | `App.tsx`, `lib/app-routes.ts` |
| Presentation layer | [screens/README.md](screens/README.md), [app/README.md](app/README.md), [components/README.md](components/README.md) |
| Pause lifecycle | `features/pause/`, `screens/pause/` |
| Subscription | `features/subscription/public-hooks` (`useSubscription`), §5.4 in launch plan |
| Legacy full IA | [`legacy/README.md`](legacy/README.md) — **not imported** |
| i18n | Shipped: `locales/en.json` only; archived langs in `legacy/locales/` |

## Architecture

- [`docs/fundamentals/client-src-layout.md`](../docs/fundamentals/client-src-layout.md) — **folder map** (`app` / `screens` / `components` / `features`), layer diagram, PR alignment checklist.
- [`docs/fundamentals/holzen-application-architecture.md`](../docs/fundamentals/holzen-application-architecture.md) — principles (bounded contexts, use cases, ports).
- [`docs/fundamentals/frontend-module-layout.md`](../docs/fundamentals/frontend-module-layout.md) — `src/features/` layout (now) and `packages/*` north star (gated).
- [`features/README.md`](features/README.md) — bounded-context folders under root Vite.
- [`docs/decisions/2026-05-17-modular-monolith-hexagonal-client.md`](../docs/decisions/2026-05-17-modular-monolith-hexagonal-client.md) — accepted ADR.
- [`docs/fundamentals/modern-react-practices-holzen.md`](../docs/fundamentals/modern-react-practices-holzen.md) — industry React norms vs Holzen (scorecard).

Read before large `src/` restructures.

## Manifest

[`docs/ops/active-surface.md`](../docs/ops/active-surface.md) — routes, edges, crons, tables, events (canonical).

## Agents

Read `.cursor/rules/active-surface.mdc` and `docs/ops/active-surface.md` before non-trivial edits. Never import from `@/legacy/*`.
