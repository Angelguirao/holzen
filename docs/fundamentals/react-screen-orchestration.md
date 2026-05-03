# React screen orchestration (Holzen)

This document captures the **principles and patterns** we applied while refactoring **`/` Home** so we can reuse them on other pages (`src/pages/*`, large `src/components/*` surfaces).

It is **not** a duplicate of [screens/home.md](../screens/home.md) (that file stays the **Home-specific** map). Use this doc when you are **designing or splitting any screen**.

## Philosophy

1. **The route component is a conductor, not a junk drawer.**  
   `Home.tsx`-style files should mostly **compose** hooks and pass results into a small number of child components. Long imperative blocks, giant `switch` trees, and dozens of `useMemo` blocks in one file are signals to extract.

2. **Behavior is easier to test and review when it has a name.**  
   Prefer **`useThing`** hooks and **`getThing` / `buildThing` pure helpers** (with Vitest) over anonymous logic embedded in JSX or effects.

3. **Types and invariants live next to the data they describe.**  
   Example: subscription UX flags live in a small **`getHomeSubscriptionGate`** helper with tests; **`useHolzen`** exposes **`trackedAssetId`** as a normalized **`TrackedAssetId`** so screens do not cast.

4. **UI boundaries carry performance and mental-load boundaries.**  
   Heavy or rare branches (Zen, modals, admin) benefit from **`React.lazy` + `Suspense`**, **`React.memo`** on expensive presentational shells, and **stable props objects** when the parent re-renders often.

## React rules (non-negotiable)

- **Rules of Hooks:** Never call hooks after conditional `return`s. If a screen has `if (!loaded) return …`, **all** hooks for signed-in UI must still run **above** that line (or move signed-in UI into a **child component** that only mounts when ready — then hooks live *inside* the child, and the parent stays minimal).  
- **Document the tradeoff:** If you keep hooks in the parent for simplicity, “Zen path still runs dashboard hooks” is acceptable **only** when the work is cheap or memoization prevents expensive children from re-rendering. Say so in the screen doc.

## Extraction heuristics (what goes where)

| Symptom | Prefer |
|--------|--------|
| Same `useMemo` dependency list repeated for related UI | One hook that returns a **single memoized bundle** (e.g. section `deps` + renderers). |
| Stable subtree re-rendering on unrelated parent updates | **`React.memo`** on the subtree + **memoized props** (`useMemo` object or a tiny `useXxxProps` hook). |
| Branch-only UI (settings sheet, zen layout) | **Lazy import** + `Suspense` so the default route stays light. |
| Booleans from props / API (`subscriptionReady`, gates) | **Pure functions** in `src/lib/` + Vitest; call them from the page or from a thin hook. |
| `useOutletContext` / route state shapes | **Exported types** in `src/lib/*` or `src/types/*` next to the screen or layout that owns the contract. |
| PostHog / analytics in handlers | Keep events in handlers, but **update [ops/event-taxonomy.md](../ops/event-taxonomy.md)** when events or properties change. |

## Checklist for a new or growing screen

1. **List modes** (loading, gated, empty, main, error) and ensure **hook order** is valid for all modes.  
2. **Pull pure logic** into `src/lib/` with tests when the rules are stable (gates, normalization, ordering).  
3. **Group hooks by concern** (`useScreenSubscription`, `useScreenLayout`, …) — mirror the Home `use-home-*` pattern with a **screen-specific prefix** if the logic is not reusable.  
4. **One presentational shell per major layout** (e.g. dashboard vs zen) — props typed and exported (`*LayoutProps`).  
5. **Memoize prop bags** passed to memoized children when profiling or when the parent is known to churn.  
6. **Document** in `docs/screens/<name>.md`: modes, hook list, important tradeoffs, and links to libs.

## Anti-patterns

- **Giant return with 40 props** duplicated between branches — extract a **`useXxxRouteProps`** + spread, or a typed builder.  
- **`as SomeType` casts** on domain ids — fix the **source hook** (`useProfile` / `useHolzen`) instead.  
- **New English copy** in a screen that already uses **`t('…')`** elsewhere — stay consistent with i18n.  
- **Silent `catch`** around product logic — prefer logging + user-visible degradation patterns already used in the app.

## Where Home fits

Home is the **reference implementation** for this playbook: see [screens/home.md](../screens/home.md) for the concrete file map and [AGENTS.md](../../AGENTS.md) for commands. When another screen reaches similar complexity, compare its `src/pages/*.tsx` to Home’s **orchestration vs. extraction** balance.

## Non-React parallels (edge / server handlers)

The same *shape* of thinking applies to **`supabase/functions/*/index.ts`** and other HTTP entrypoints, even though there are no React hooks:

| Screen / SPA idea | Edge / handler analogue |
|--------------------|-------------------------|
| Page as conductor | **`index.ts` stays thin**: parse request → call small modules in `_shared/` or feature files → map result to HTTP. |
| Named, testable behavior | **Pure parsers + validators** in `src/lib`-style modules (or `_shared/*.ts`) with unit tests where Deno/Vitest fit; keep I/O at the edges. |
| Types at the source | **Typed request/response shapes** (and `EdgeError` codes) instead of ad-hoc `any` and stringly errors. |
| UI boundaries / perf | **Single responsibility per function**; avoid mega-handlers; shared **`withRequestLogging`** wrapper for every HTTP-serving `index.ts`. |
| Document tradeoffs | **Function-level README or ops doc** when auth, rate limits, or deploy order matter; keep [ops/deployment-sync-guide.md](../ops/deployment-sync-guide.md) in mind when `config.toml` or migrations move with code. |

**Canonical edge conventions:** [ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md) (`withRequestLogging`, `logDependencyCall`, `EdgeError`, audit). **Broader logging story:** [ops/logging-strategy.md](../ops/logging-strategy.md) (browser vs edge vs DB, correlation IDs).

## Related reading

- [refactoring-strategy.md](refactoring-strategy.md) — incremental refactors and full-stack touchpoints.  
- [navigating-the-codebase.md](navigating-the-codebase.md) — routing, auth, hooks at app level.  
- [backlog/react-page-and-hook-splitting.md](../backlog/react-page-and-hook-splitting.md) — backlog ideas that overlap with this playbook.  
- [ops/edge-logging-conventions.md](../ops/edge-logging-conventions.md) — edge handler structure and observability.  
- [ops/logging-strategy.md](../ops/logging-strategy.md) — where logs live and how they relate to the SPA.
