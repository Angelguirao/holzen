# Marketing roadmap & BTC reserve (legacy)

Public `/roadmap` voting UI and `/reserve` treasury transparency page — **not shipped** in pause-first MVP.

Moved from `src/screens/marketing/` per product scope: marketing surface will live on the Astro site (`apps/site`); these pages are not in the active SPA route table.

## Postgres (still present)

- `roadmap_items`, `roadmap_votes` — used only by legacy `RoadmapScreen` + `roadmap-query.ts`
- No client queries from active `src/` (`check:active-surface` blocks `.from('roadmap_items'|'roadmap_votes')`)

## Re-enabling

1. Restore routes in `src/App.tsx` (lazy-load screens from this folder).
2. Re-export roadmap query helpers from `@/features/user/public-queries` if other surfaces need them.
3. Remove roadmap table guards from `scripts/check-active-surface.mjs`.
4. Update [docs/ops/active-surface.md](../../../docs/ops/active-surface.md) and [docs/ops/marketing-site-split.md](../../../docs/ops/marketing-site-split.md).

Legacy may import active `@/features/*`, `@/components/ui/*`, and `@/screens/marketing/components/*`; active code must not import `@/legacy/marketing-roadmap-reserve/**`.
