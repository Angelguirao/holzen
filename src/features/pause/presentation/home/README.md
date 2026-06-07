# `presentation/home/` — Home pause conductors

Home-specific pause **read-models and projections** (route UI stays in `src/screens/home/`).

**Start here:** [docs/systems/home-pause-widget-client-architecture.md](../../../docs/systems/home-pause-widget-client-architecture.md)

## Quick map

| Concern | Entry |
|---------|--------|
| Shared context (market + open pause) | `use-holzen-home-context-state.ts` → `pause-home-context.tsx` |
| Open pause from DB | `use-open-pause-home-preview.ts` |
| Widget inputs composer | `use-home-pause-widget-inputs.ts` |
| Widget projection | `use-home-pause-widget-projection.ts` |
| Body DTO assembly | `assemble-home-pause-widget-projection.ts` |
| Side effects (collapse, clock, calm toast) | `use-home-pause-widget-*` siblings in this folder |
| Domain pure logic | `../../domain/home/` (`home-pause-widget-surface.ts`, …) |

Export surface for screens: `@/features/pause/public-home`.
