# BTC price cache: historical freshness vs cron (Pending)

## Context (from Phase 4)

`refresh-btc-prices` upserts `btc_price_cache` for current day and **historical "on this day"** rows when data is missing or older than **24h**. Cron runs on a **~15 minute** cadence (see `docs/ops/cron-setup.md`).

## Current problem

**Zoom Out** and other features depend on this cache for **historical** prices without calling CoinGecko at user time. **Accuracy** of "on this day" for a given calendar date is bounded by:

- when the row was last refreshed,
- and the 24h staleness threshold.

## Implications if we leave it as-is

- Edge cases around **day boundaries** (UTC vs local), **first run after deploy**, or **missed cron** windows can show slightly stale historical numbers until the next refresh cycle.
- Usually acceptable; may matter if product promises **sub-daily** accuracy for historical comparison.

## Proposed improvement

- **Document** the intended freshness contract for Zoom Out (e.g. "good enough for daily metaphor, not intraday trading").
- **If** product needs stricter freshness: shorten TTL, increase cron frequency, or refresh historical rows on a different schedule (tradeoff: CoinGecko rate limits — see `refresh-btc-prices` delay between calls).

## Related code pointers

- `supabase/functions/refresh-btc-prices/index.ts`
- `docs/ops/cron-setup.md`

## Acceptance criteria / how to verify

1. Product/stakeholders agree on acceptable staleness for historical BTC lines in Zoom Out.
2. If policy tightens, rate limits and cron load are still within acceptable bounds.
