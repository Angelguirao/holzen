# Holzen frontends

| Path | Role | Deploy |
| --- | --- | --- |
| `apps/site/` | Astro marketing HTML (`/welcome`, …) | Merged into root `dist/` via `npm run build:unified` |
| Repo root `src/` | React/Vite product SPA (`spa.html`) | Same Vercel project → `holzen.app` |

Shared tokens: `packages/design-tokens/`.

See [docs/ops/marketing-site-split.md](../docs/ops/marketing-site-split.md).
