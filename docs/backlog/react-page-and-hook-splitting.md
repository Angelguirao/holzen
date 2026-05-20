# React: split large pages and decompose heavy hooks

**Status:** backlog — incremental refactors (no big-bang).

## Progress (slices shipped)

| When | Slice |
|------|--------|
| 2026-04 | **`Home`:** `NeedAMomentButton`, `AutoCooldownIndicator`, and `ProLockedWidget` moved to **`src/screens/home/components/HomePauseChrome.tsx`**. |
| 2026-04 | **`PauseSession`:** localStorage + types → **`src/features/pause/infrastructure/session/persisted-session-storage.ts`**; loading/error full-screen → **`PauseSessionGate`**; curtain / gradient / chrome → **`PauseSessionScaffold`**. |
| 2026-04 | **`useHolzen` producer split:** pure helpers → **`reflection-persist-error`** (`features/pause/application/use-cases/`), **`manual-cooldown`** (`features/market/application/`), market context + severity in **`features/market`** / **`features/pause/public`**. Conductors → **`features/pause/presentation/use-holzen-home-context-state.ts`** + **`use-holzen-manual-trigger-orchestration.ts`**; **`useHolzen()`** exported from **`HolzenProvider`**. |
| 2026-04 | **`use-companion-data`:** helpers consolidated under **`features/pause/`** (orchestrate types, reflection cache, mood history, sources, recency, completion sync/maps, slot-apply, URL) + favorites on **`pause_instances.metadata`**. Hook in **`features/pause/presentation/`**; use cases transitional at **`application/use-cases/companion/`** → target **`ritual/frame/`**. |

## Goal

Improve **maintainability and testability** by breaking up **oversized page modules** and optionally **narrowing** very large custom hooks — without changing product behavior.

## Rationale

The app already follows sound patterns (function components, custom hooks, route guards). Several **pages** carry most of a flow in one file (e.g. **`Home`**, **`PauseSession`**), and **`use-holzen`** bundles BTC context, reflection generation, cooldowns, and profile updates. That is **shippable** but makes **reviews, refactors, and unit tests** harder than necessary.

## Direction

- **Screens:** Extract **presentational** subcomponents and small hooks under `src/screens/<route>/components/` and `hooks/` — follow `screens/pause/components/Pause*` patterns. See [client-src-layout.md](../fundamentals/client-src-layout.md).
- **`use-holzen`:** Consider splitting only where boundaries are clear (e.g. cooldown helpers vs `generateMessage` vs BTC fetch), after tests or a stable API for callers.
- **Scope:** Touch **one vertical slice per PR**; avoid drive-by renames across the tree.

## Related

- [**Refactoring strategy (canonical)**](../fundamentals/refactoring-strategy.md) — principles, boundaries (hook vs `src/lib`), anti-patterns, and how this backlog fits the architecture.
- [route-level-code-splitting.md](route-level-code-splitting.md) — **when** route modules load (lazy vs eager); complements splitting **within** a page.
- [pause-session-hydration.md](pause-session-hydration.md) — navigation state complexity overlaps Pause surface.
- [AGENTS.md](../../AGENTS.md) — ESLint baseline; avoid widening debt in touched files.
