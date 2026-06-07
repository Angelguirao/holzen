# `presentation/home/` — Home pause conductors

Home-specific pause **read-models and projections** (not route components — those live in `src/screens/home/`).

**Start here:** [docs/systems/home-pause-widget-client-architecture.md](../../../docs/systems/home-pause-widget-client-architecture.md)

## Quick map

| Concern | Entry |
|---------|--------|
| Shared context (market + open pause) | `use-holzen-home-context-state.ts` → `pause-home-context.tsx` |
| Open pause from DB | `use-open-pause-home-preview.ts` |
| Widget projection | `use-home-pause-widget-projection.ts` |
| Widget side effects | `widget/` (collapse, cooldown clock, calm toast, mode transitions) |
| Discard from widget | `use-pause-home-discard-from-widget.ts` |
| Domain pure logic | `../../domain/home/` |

Export surface for screens: `@/features/pause/public-home`.
