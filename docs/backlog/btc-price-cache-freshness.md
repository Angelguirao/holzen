# BTC price cache: historical freshness vs cron

**Shipped (2026-04) — documentation.** Code behavior unchanged; contract is explicit for product and ops.

## Contract

- **Zoom Out** and session code read **`btc_price_cache` only** (no CoinGecko during user requests).
- **Cron** `refresh-btc-prices` runs about every **15 minutes** (project schedule; see `docs/ops/cron-setup.md`).
- **Historical** “on this day” rows (1–10 years back; `btc-on-this-day-config.ts`) are **skipped** when already present with `fetched_at` within the last **24 hours** — balances freshness vs CoinGecko limits.
- **UTC** calendar dates define “today” and anniversaries, matching `generateZoomOut` / `fetchHistoricalAndCurrentPrices`.

This is **good enough for daily metaphor**, not sub-daily trading accuracy. Tightening policy requires revisiting rate limits in `refresh-btc-prices` (delays between CoinGecko calls).

## Where it lives

- `supabase/functions/refresh-btc-prices/index.ts` — implementation + file header summary
- `docs/ops/cron-setup.md` — cron schedule + **Freshness contract** subsection
