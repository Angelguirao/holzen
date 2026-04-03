# React: split large pages and decompose heavy hooks

**Status:** backlog — incremental refactors (no big-bang).

## Goal

Improve **maintainability and testability** by breaking up **oversized page modules** and optionally **narrowing** very large custom hooks — without changing product behavior.

## Rationale

The app already follows sound patterns (function components, custom hooks, route guards). Several **pages** carry most of a flow in one file (e.g. **`Home`**, **`PauseSession`**), and **`use-holzen`** bundles BTC context, reflection generation, cooldowns, and profile updates. That is **shippable** but makes **reviews, refactors, and unit tests** harder than necessary.

## Direction

- **Pages:** Extract **presentational** subcomponents and small hooks colocated under `src/components/<feature>/` or `src/pages/<Feature>/parts/` — follow existing patterns (`pause/Pause*` components).
- **`use-holzen`:** Consider splitting only where boundaries are clear (e.g. cooldown helpers vs `generateMessage` vs BTC fetch), after tests or a stable API for callers.
- **Scope:** Touch **one vertical slice per PR**; avoid drive-by renames across the tree.

## Related

- [route-level-code-splitting.md](route-level-code-splitting.md) — **when** route modules load (lazy vs eager); complements splitting **within** a page.
- [pause-session-hydration.md](pause-session-hydration.md) — navigation state complexity overlaps Pause surface.
- [AGENTS.md](../../AGENTS.md) — ESLint baseline; avoid widening debt in touched files.
