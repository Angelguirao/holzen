# Data fetching: TanStack Query vs Supabase + useEffect

**Status:** shipped (2026-04) for **documentation**; global **`QueryClient` defaults** remain **optional** / deferred.

## What shipped

- **Rules of thumb** and a summary table live in **[`docs/fundamentals/navigating-the-codebase.md`](../fundamentals/navigating-the-codebase.md) §6.1** — when to prefer **`useQuery` / `useMutation`**, when to keep **`useEffect` + Supabase**, and how **`fetchBtcData`** coalescing fits in.
- Guidance to **avoid unscoped `defaultOptions`** on the root **`QueryClient`** until conventions are agreed; per-query options (as in **`use-subscription.ts`**) stay the pattern.

## Optional follow-ups

- Set shared **`QueryClient` defaults** (e.g. `staleTime`, `retry`) in **`App.tsx`** once several queries agree on behavior.
- Lift **`profiles`** to a layout-level **`useQuery`** ([home-fetch-deduplication.md](home-fetch-deduplication.md)).
- Migrate individual hooks when touching them — no big-bang rewrite.

## Related

- [home-fetch-deduplication.md](home-fetch-deduplication.md)
- [mental-models-for-contributors.md](../fundamentals/mental-models-for-contributors.md)
- [client-server-architecture-holzen.md](../fundamentals/client-server-architecture-holzen.md) — mental model for **server state** (Query cache) vs **UI-only** state and where authority lives
