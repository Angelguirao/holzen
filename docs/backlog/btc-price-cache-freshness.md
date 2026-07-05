# Market price cache: historical freshness vs cron

**Shipped (2026-04) — documentation.** Code behavior unchanged; contract is explicit for product and ops.

**Renamed (2026-06):** table `market_price_cache`, cron `refresh-market-prices`, edge helpers `_shared/market-price-warm.ts` / `market-on-this-day-config.ts`. Legacy names in older review notes refer to the same contract.

## Contract

- **Zoom Out** and session code read **`market_price_cache` only** (no CoinGecko during user requests).
- **Cron** `refresh-market-prices` runs about every **15 minutes** (project schedule; see `docs/ops/cron-setup.md`).
- **Historical** “on this day” rows (1–10 years back; `market-on-this-day-config.ts`) are **skipped** when already present — immutable closing prices for past UTC dates.
- **UTC** calendar dates define “today” and anniversaries, matching Look Back / zoom-out generators.

This is **good enough for daily metaphor**, not sub-daily trading accuracy. Tightening policy requires revisiting rate limits in `refresh-market-prices` (delays between CoinGecko calls).

## Where it lives

- `supabase/functions/refresh-market-prices/index.ts` — implementation + file header summary
- `docs/ops/cron-setup.md` — cron schedule + **Freshness contract** subsection
