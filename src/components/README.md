# Shared presentation (`src/components/`)

**Design system** (`ui/`) and **cross-route iconography** (`icons/`). Route-scoped UI lives in [`src/screens/`](../screens/README.md); shell chrome in [`src/app/`](../app/README.md); domain rules in [`src/features/`](../features/README.md).

The repo root of this folder (`src/components/*.tsx`) is **closed** — presentation migrated to `screens/<route>/components/` during wave 5. Only `ui/` and `icons/` remain active subtrees.

**Canonical:** [client-src-layout.md](../../docs/fundamentals/client-src-layout.md), [frontend-module-layout.md](../../docs/fundamentals/frontend-module-layout.md) §11 (waves 5b–5i), [DESIGN.md](../../DESIGN.md), [docs/design/nox/README.md](../../docs/design/nox/README.md).

## Where UI lives

| Location | Put here when… |
|----------|----------------|
| [`ui/`](ui/) | Primitive or composite used on **two or more** routes; no domain orchestration |
| [`icons/`](icons/) | Shared SVG glyphs for product vocabulary (mood / outcome) |
| `screens/<route>/components/` | UI for **one** route or tab only |
| [`app/components/`](../app/components/) | Cross-route shell (nav, meta, global widgets) — see [app/README.md](../app/README.md) |

## Layout

```text
components/
  ui/           # shadcn / Radix primitives + Holzen composites
  icons/        # MoodIcon, OutcomeIcon, glyph maps
```

| Subfolder | Role |
|-----------|------|
| [`ui/`](ui/) | Import as `@/components/ui/<name>`. Prefer semantic tokens in `src/index.css` and `tailwind.config.ts` over one-off colors. |
| [`icons/`](icons/) | `MoodIcon`, `OutcomeIcon`, `MOOD_GLYPHS`, `MOOD_ICONS`, `OUTCOME_ICONS`. Used heavily by pause ritual screens. |

### Holzen composites (not upstream shadcn)

Extend these before inventing ad-hoc markup in screens:

| File | Typical use |
|------|-------------|
| `loading-button.tsx` | Async actions with pending state |
| `loading-spinner.tsx` | Inline loading indicator |
| `state-card.tsx` | Marketing / auth status panels |
| `status-card.tsx` | Compact status summaries |
| `process-stepper.tsx` | Multi-step flows |
| `layout-spacing.tsx` | Consistent section spacing |
| `threshold-slider.tsx` | Numeric threshold control (Settings) |
| `control-selector.tsx` | Segmented control picker |
| `value-equivalence.tsx` | BTC / fiat equivalence display |
| `tag.tsx` | Selectable filter chips |

Everything else under `ui/` is standard shadcn/Radix — add via the project’s shadcn workflow when possible.

## Rules

1. **No new files** at `src/components/*.tsx` (repo root) — use `screens/<route>/components/`, `app/components/`, or `ui/`. Enforced by `npm run check:no-root-components` (in `test:ci`).
2. **No domain logic** in `ui/` or `icons/` — wire data from screens via props; call `@/features/<context>/public` from screen hooks, not from primitives.
3. **No `@/legacy/**`** imports in active code.
4. **Promote to `ui/`** only when a second route needs the same component; otherwise colocate under the screen folder.
5. **New ritual-specific art** → `screens/pause/components/` unless another shipped route needs the same glyph.

## Navigation cheat sheet

| I need… | Start here |
|---------|------------|
| Button, dialog, form field | `components/ui/` |
| Mood / outcome glyph | `components/icons/` |
| Pause step UI | `screens/pause/components/` |
| Home / Archive / Settings widgets | `screens/<route>/components/` |
| Bottom nav, feedback, checkout chrome | `app/components/` |
| Visual tokens / Nox migration | [DESIGN.md](../../DESIGN.md), [nox/](../../docs/design/nox/README.md) |

## Related

- [screens/README.md](../screens/README.md) — route presentation layer
- [app/README.md](../app/README.md) — app shell
- [features/README.md](../features/README.md) — bounded contexts
- Pre-strip root widgets (reference only, do not import): [`legacy/quarantine/root-components/`](../legacy/quarantine/root-components/)
