# React: split large pages and decompose heavy hooks

**Status:** backlog — incremental refactors (no big-bang).

## Progress (slices shipped)

| When | Slice |
|------|--------|
| 2026-04 | **`Home`:** `NeedAMomentButton`, `AutoCooldownIndicator`, and `ProLockedWidget` moved to **`src/components/home/HomePauseChrome.tsx`**. |
| 2026-04 | **`PauseSession`:** localStorage + types → **`src/lib/pause-session-storage.ts`**; loading/error full-screen → **`PauseSessionGate`**; curtain / gradient / chrome → **`PauseSessionScaffold`**. |
| 2026-04 | **`use-holzen`:** pure helpers → **`reflection-persist-error`**, **`holzen-manual-cooldown`**, **`pause-context-from-btc`**, **`btc-move-severity`**, **`next-cron-quarter`** (`src/lib/`). Hook still owns orchestration + state. |
| 2026-04 | **`use-companion-data`:** orchestrate types, reflection cache fetch+parse, mood-history query, signal/grounding source catalogs, recency localStorage hints, library autosave, completion load/persist, column maps, URL helper → **`companion-orchestrate-types`**, **`companion-reflection-cache`**, **`companion-mood-history`**, **`companion-orchestrate-sources`**, **`companion-recency-hints`**, **`companion-library-autosave`**, **`companion-completion-sync`**, **`companion-completion-maps`**, **`companion-orchestrate-slot-apply`**, **`companion-url`** (`src/lib/`). Hook still owns state + invoke orchestration. |

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
