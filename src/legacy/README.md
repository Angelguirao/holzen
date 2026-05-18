# `src/legacy/` — full-shell reference (not shipped)

Holzen’s **shipped** React app lives outside this folder. Nothing under `legacy/` is imported by active `src/` code.

## Recovery

| Artifact | Purpose |
| -------- | ------- |
| Git tag `full-ia-pre-strip` | Point-in-time snapshot before pause-first strip |
| Branch `archive/full-ia-pre-strip` | Same commit, easy checkout for read/cherry-pick |
| `legacy/full-shell/` | Bulk-moved UI, pages, hooks, and libs from the pre-strip tree |

## Rules

- **Do not** add `import … from '@/legacy/…'` in active code.
- Vitest and TypeScript exclude `src/legacy/**` (see `vitest.config.ts`, `tsconfig`).
- To restore a feature: port deliberately into active `src/`, register routes in `App.tsx`, update [`docs/ops/active-surface.md`](../docs/ops/active-surface.md).

## Layout (after Step 3)

```
legacy/
  README.md          ← this file
  full-shell/        ← pre-MVP IA (tools, stats, journey tabs, badges, …)
  locales/           ← full i18n bundles (Step 4)
```

Canonical shipped manifest: [`docs/ops/active-surface.md`](../docs/ops/active-surface.md).
