# Home (signed-in): dedupe redundant client fetches

**Status:** partial — **subscription + market client dedupe shipped (2026-04)**; optional TanStack **`profiles`** lift still open.

## Progress

- **`profiles` — duplicate loads from auth object identity (done):** `useProfile` depends on **`[user?.id]`** only (`src/hooks/use-profile.ts`).
- **`check-subscription` — shared query (done):** `useSubscription` uses **`useQuery`** with **`queryKey: ['subscription', userId]`**. All consumers (Home, Settings, Profile, `useProGate`, PauseSession, etc.) share **one** in-flight request and cache; 5‑minute **`staleTime`** + interval + focus invalidate with **`force`** preserved via module flags. **`readSubCache()`** still seeds UI while the first fetch runs.
- **Market / BTC — in-flight coalescing (done):** `fetchBtcData` in **`src/lib/btc.ts`** dedupes concurrent calls per **currency** (`Map` of promises) so interval + **`manualTrigger`** (or overlapping effects) do not double-hit CoinGecko / mempool / F&G in the same tick.

## Still optional (not required to close ticket)

- Lift **`profiles`** into a single **`useQuery`** at layout level (or stricter stale policy) if DevTools still shows duplicate **`profiles`** rows from multiple trees.

## Doc pointer (done 2026-04)

- **`docs/fundamentals/navigating-the-codebase.md`** §6 — **`useSubscription`**, **`fetchBtcData`**, and **`use-profile`** / optional layout query (links here and [data-fetching-conventions.md](data-fetching-conventions.md)).

## Related

- [data-fetching-conventions.md](data-fetching-conventions.md)
- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md)
- [btc-price-cache-freshness.md](btc-price-cache-freshness.md) — server BTC cache vs client
