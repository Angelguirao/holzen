# ADR: Render boundaries now; defer React Compiler and React 19

**Date:** 2026-05-23  
**Status:** accepted

## Context

Industry guidance converged on two related ideas:

1. **Render boundaries** — performance comes from *where* state lives and which subtrees re-render, not from sprinkling `useMemo` / `useCallback` everywhere.
2. **React Compiler + React 19** — build-time memoization (Compiler) and first-class async mutations (`useActionState`, `useOptimistic`, form Actions) reduce manual performance and form boilerplate.

Holzen today:

- **React 18.3.1** + **Vite** + `@vitejs/plugin-react-swc` (no React Compiler plugin).
- **TanStack Query** + **`invokeEdge`** for server reads and most mutations.
- **react-hook-form + Zod** on validated forms.
- **Documented boundary pattern** on Home: `memo(HomeDashboardLayout)` + `useHomeDashboardLayoutProps` ([react-screen-orchestration.md](../fundamentals/react-screen-orchestration.md)).
- **Active `src/` architecture migration** — behavior-preserving, pause-first scheduling.

Adopting React Compiler or upgrading to React 19 during migration adds a second axis of change (build config, render semantics, test churn) without unblocking shipped scope.

## Decision

### Now (during architecture migration)

1. **Optimize for render boundaries first** when touching UI:
   - Move state lower in the tree when possible.
   - Use `React.memo` on heavy presentational shells (Home dashboard pattern).
   - Use `React.lazy` + `Suspense` for rare/heavy branches.
   - Add `useMemo` / `useCallback` only when feeding a memo child, caching expensive derivation, or satisfying **`useEffect` dependencies** — not preemptively.

2. **Do not adopt React Compiler** until post-migration stabilization.

3. **Do not upgrade to React 19** until post-migration stabilization.

4. **Keep TanStack Query + `invokeEdge`** as the mutation model. Do not refactor toward `<form action>` / Actions during migration.

5. **Do not mass-delete** existing `useMemo` / `useCallback` in Home, Pause session, or companion hooks unless the file is already in scope and profiling or review justifies it.

### Later (separate tracks, after migration tiers are clean)

| Track | Trigger | Action |
|-------|---------|--------|
| **A. React Compiler pilot** | `src/` migration stable; test + build green | Add `babel-plugin-react-compiler` to Vite; lint/annotation mode first; profile Home + pause session; remove redundant memos only with tests |
| **B. React 19 upgrade** | Track A done or skipped; Lovable/Vite deps confirmed | Bump React + types; pilot **one** simple settings mutation with `useActionState` / `useOptimistic`; keep Query for reads and complex flows |

Expo SDK 54 is **not** a Holzen signal — shipped product is a Vite SPA on Lovable.

## Consequences

- **Positive:** Reviewers have a single policy; migration PRs avoid compiler/React 19 churn; Home remains the reference boundary pattern.
- **Negative:** Manual memo boilerplate persists until Compiler pilot; no Actions-based form UX until React 19 track.
- **Follow-ups:** PR checklist in [modern-react-practices-holzen.md](../fundamentals/modern-react-practices-holzen.md) §6; pilot candidates documented in §2.9 of same file.

## Recovery

If Compiler or React 19 causes regressions after adoption: disable the plugin or pin React 18; boundaries and Query remain valid regardless.
