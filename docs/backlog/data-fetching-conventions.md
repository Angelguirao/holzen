# Data fetching: TanStack Query vs Supabase + useEffect

**Status:** backlog — document first, then align gradually.

## Goal

Make **server state** handling **predictable** across features: when to use **TanStack Query** (`useQuery` / `useMutation`) vs **direct `supabase` calls inside `useEffect`**.

## Rationale

The root tree provides **`QueryClientProvider`** (`src/App.tsx`), but features differ: some hooks use **React Query**, others use **Supabase client + `useEffect`**. Both are valid; inconsistency makes **caching, retries, and loading state** harder to reason about for new contributors.

## Direction

1. **Short doc** (this repo: `docs/fundamentals/` or a paragraph in [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md)): rules of thumb — e.g. Query for **shared/refetched** server data; effects for **one-shot** or **tightly coupled** side effects to a single screen.
2. **Optional:** Set **`QueryClient` default options** (e.g. `staleTime`, `retry`) in `App.tsx` when conventions stabilize — avoid churn until then.
3. **Migrate opportunistically** when touching a feature, not as a standalone rewrite.

## Related

- [mental-models-for-contributors.md](../fundamentals/mental-models-for-contributors.md) — TanStack Query section.
- [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) — feature hooks table.
