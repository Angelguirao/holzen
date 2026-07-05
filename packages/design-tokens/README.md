# @holzen/design-tokens

Shared CSS custom properties for Holzen marketing (`apps/site`) and the product SPA (`src/index.css` should stay aligned).

**Source of truth for product styling:** `src/index.css` + `tailwind.config.ts` + [DESIGN.md](../../DESIGN.md).

When tokens change in the SPA, update `tokens.css` here in the same PR so the Astro site does not drift.
