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

## Manifest

[`docs/ops/active-surface.md`](../docs/ops/active-surface.md) — routes, edges, crons, tables, events (canonical).

## Agents

Read `.cursor/rules/active-surface.mdc` and `docs/ops/active-surface.md` before non-trivial edits. Never import from `@/legacy/*`.
