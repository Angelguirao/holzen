# Home (signed-in): dedupe redundant client fetches

**Status:** backlog — measured from browser network panel after password sign-in.

## Goal

After login on **`/`**, reduce **duplicate** HTTP work: the same **Supabase** reads, **Edge Function** calls, and **third-party** market bundles should not fire **many times in parallel** for one paint unless each call is intentional.

## Rationale

A DevTools capture on **`http://localhost:8080/`** after sign-in showed, among other things:

- **`profiles`** — multiple **`GET`**s with the **same large `select=`** list (full settings row) in one short window.
- **`check-subscription`** — **`POST`** more than once with **200** responses.
- **Market context** — **CoinGecko** (`market_chart` 1d/7d), **alternative.me** (Fear & Greed), **mempool.space** (mempool, fees, hashrate, tip height) **repeated** in a loop-like pattern, consistent with **several hooks or effects** requesting the same data without a shared cache.

This increases **latency**, **API quota** exposure (external providers), and **Supabase** load. It overlaps with [data-fetching-conventions.md](data-fetching-conventions.md) (Query vs effects) but is a **concrete Home surface** ticket.

## Direction

1. **Profile row:** Prefer **one** source of truth for the authenticated **`profiles`** row on Home (e.g. TanStack **`useQuery`** with a stable key, or lift reads into a parent and pass props) before adding new widgets.
2. **Subscription:** Ensure **`check-subscription`** is invoked from **one** place per session/navigation, or dedupe via Query **`staleTime`** / shared mutation state.
3. **BTC / mempool / F&G:** Centralize **market snapshot** fetch (single hook or query) consumed by **`use-holzen`**, **`BtcStatus`**, charts, etc.; verify **`useEffect`** dependency arrays are not retriggering identical fetches on every render.
4. **Verify** with Network panel after changes (filter **Fetch/XHR**); optional: add a short note in [navigating-the-codebase.md](../fundamentals/navigating-the-codebase.md) if a canonical “market data” hook is introduced.

## Related

- [data-fetching-conventions.md](data-fetching-conventions.md) — broader Query vs Supabase + **`useEffect`** alignment.
- [react-page-and-hook-splitting.md](react-page-and-hook-splitting.md) — **`Home`** / **`use-holzen`** decomposition may make deduping easier.
- [btc-price-cache-freshness.md](btc-price-cache-freshness.md) — server-side BTC cache vs client expectations (related domain, different layer).
