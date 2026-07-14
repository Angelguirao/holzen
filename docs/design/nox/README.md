# Nox design system (Holzen)

Contract for the **Nox** visual system: dark-first, calm blues, mustard highlight, Inter + Newsreader.

## Start here

| Doc | Purpose |
|-----|---------|
| [`DESIGN.md`](../../DESIGN.md) | Agent-facing design contract (colors, type, layout, motion, voice) |
| [`patterns/marketing.md`](patterns/marketing.md) | Marketing-only elevation and glass rules |
| [`parity-board.md`](parity-board.md) | Route-level design migration status |
| [`../code-connect.md`](../code-connect.md) | Figma Code Connect — Nox ↔ `src/components/ui` |

## Token source of truth

```
packages/design-tokens/tokens.css   ← raw --nox-* / --font-* variables
src/index.css                       ← imports tokens + shadcn semantic bridge
apps/site/src/styles/site.css       ← imports tokens for Astro marketing
```

Run `npm run check:design-tokens` before merging UI changes.

## Tailwind

Use `nox.*` utilities from `tailwind.config.ts` (e.g. `text-nox-text-highlight`, `border-nox-border-default`). Do not use removed `text-cyan` or hardcoded hex in active `src/`.
