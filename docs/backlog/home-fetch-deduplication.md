# Home (signed-in): dedupe redundant client fetches

**Status:** partial — **subscription + market client dedupe shipped (2026-04)**; TanStack **`profiles`** row query **shipped** in `@/features/user/public-hooks` (`useProfile`, `PROFILE_QUERY_KEY`, shared cache across every `useHolzen()` instance).

## Progress

- **`profiles` — duplicate loads from auth object identity (done):** `useProfile` depends on **`[user?.id]`** only (`src/features/user/presentation/` — see `@/features/user/public-hooks`).
- **`check-subscription` — shared query (done):** `useSubscription` uses **`useQuery`** with **`queryKey: ['subscription', userId]`**. All consumers (Home, Settings, Profile, `useProGate`, PauseSession, etc.) share **one** in-flight request and cache; 5‑minute **`staleTime`** + interval + focus invalidate with **`force`** preserved via module flags. **`readSubCache()`** still seeds UI while the first fetch runs.
- **Market / BTC — in-flight coalescing (done):** `fetchBtcData` in **`src/features/market/infrastructure/fetch-market-data.ts`** dedupes concurrent calls per **currency** (`Map` of promises) so interval + **`manualTrigger`** (or overlapping effects) do not double-hit CoinGecko / mempool / F&G in the same tick.

## Still optional (not required to close ticket)

- If DevTools still shows redundant work, consider a **layout-level** profile provider (one hook instance) — the shared **`['profile', userId]`** query already dedupes the network read across trees.

## Doc pointer (done 2026-04)

- **`docs/fundamentals/navigating-the-codebase.md`** §6 — **`useSubscription`**, **`fetchBtcData`**, and **`useProfile`** / optional layout query (links here and [data-fetching-conventions.md](data-fetching-conventions.md)).

## Related

- [data-fetching-conventions.md](data-fetching-conventions.md)
- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md)
- [btc-price-cache-freshness.md](btc-price-cache-freshness.md) — server BTC cache vs client
