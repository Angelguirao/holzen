# Tracked asset class evolution (backlog)

**Status:** preparation slice (Jun 2026) — bitcoin-only shipped; schema and naming aligned for future asset classes.  
**Owner:** market bounded context + `profiles.tracked_asset_id`  
**Related:** [market-client-architecture.md](../systems/market-client-architecture.md), [pause-system.md](../systems/pause-system.md)

---

## 1. Product intent

Holzen watches **one store-of-value asset per user** today. Pause-first ships **bitcoin only**, but the column name `tracked_asset_id` and catalog model are intentionally **provider-native opaque strings**, not “BTC forever” hardcoding.

Future classes (more cryptos, equities, commodities) should extend a **catalog + quote adapter** without renaming the profile column on day one.

---

## 2. What shipped in this slice

| Surface | Change |
|---------|--------|
| `src/features/market/domain/tracked-assets.ts` | `TrackedAssetDefinition` (`id`, `symbol`, `kind`, `provider`); `TRACKED_ASSETS = [bitcoin]`; `isBitcoinTrackedAsset()` |
| `supabase/functions/_shared/tracked-assets.ts` | Same allowlist |
| Migration `20260606140000_tracked_asset_bitcoin_only.sql` | Coerce non-bitcoin rows → `bitcoin`; `update_profile_safe` accepts `bitcoin` only |
| Settings | Asset picker hidden when catalog length is 1 (read-only label) |
| i18n | Removed ETH/SOL/XMR settings labels; active UI uses `marketStatus.*`, `settings.unitBasisMode*`, `pause.frame.lookBackContent.market*` |
| Client naming | `MarketQuote`, `marketData`, `MarketStatus`/`MarketChart`, `marketInsight` dual-read, breathe-ambient market query; deprecated aliases retained for `@/legacy` |

---

## 3. 360° readiness map

### Ready (generic enough)

| Layer | Notes |
|-------|--------|
| **Postgres** | `profiles.tracked_asset_id` text — not BTC-specific column name |
| **Profile RPC** | Allowlist in `update_profile_safe`; extend CASE / catalog when shipping assets |
| **Client catalog** | `TrackedAssetDefinition` separates **identity** from **quote provider** |
| **Fetch pipeline** | `fetchMarketData(coinId, currency)` already parameterized by CoinGecko id |
| **Volatility cron** | `check-volatility` uses profile asset + shared threshold helpers |
| **Pause context builders** | `buildPauseContextFromMarket`, manual reflect context take normalized asset id |
| **Look Back client parse** | `marketInsight` canonical; dual-reads legacy `btcInsight` from cache/edge JSON |

### Bitcoin-specific (gate on `isBitcoinTrackedAsset()`)

| Feature | Location (representative) |
|---------|---------------------------|
| On-chain block (mempool, fees) | `fetch-market-data.ts`, `OnChainData` |
| Home “1 BTC = 1 BTC” unit display mode | `use-market-display-preferences.ts`, `holzen_unit_basis_mode` localStorage (dual-reads legacy `holzen_btc_mode`) |
| Zoom-out anniversary companion copy | edge `companion-orchestrate` / zoom-out tasks |
| Fear & Greed index | crypto-wide today; may stay crypto-only or become optional per kind |
| User-visible “BTC on this day” copy | Product-accurate for pause-first; not genericized intentionally |

### Not prepared (explicit deferrals)

| Gap | Why |
|-----|-----|
| **Multiple assets per user** | Single `tracked_asset_id` column; Home widget, thresholds, pause copy assume one |
| **Equity quote provider** | No port implementation; CoinGecko-only infrastructure |
| **Asset kind in DB** | Kind lives in client/edge catalog only — add `tracked_assets` reference table if catalog grows |
| **Trading hours / market calendars** | Volatility cron assumes 24/7 crypto charts |
| **Regulatory copy per asset class** | Product/legal not scoped |
| **Edge serialized keys** | Legacy `btcInsight` dual-read on client + edge until TTL clears; new writes use `marketInsight` only |

---

## 4. Recommended migration path (when adding an asset)

1. Add row to `TRACKED_ASSETS` (client) + `_shared/tracked-assets.ts` + `update_profile_safe` CASE in **one PR**.
2. Confirm `fetchMarketData` / cron chart fetch supports the provider id (CoinGecko path already generic).
3. Gate BTC-only UI with `isBitcoinTrackedAsset(trackedAssetId)` — do not branch on string literals scattered in screens.
4. Add i18n `settings.trackedAssets.{id}` and onboarding copy if user-selectable.
5. PostHog: keep `tracked_asset_id` property on relevant events (already sanitized string).
6. Edge: dual-write `marketInsight` + keep reading `btcInsight` until cache backfill or TTL clears legacy rows.

For **equities**, expect a new `AssetQuoteProvider` value, a `ports/market-data` adapter, and likely a **reference table** instead of a growing CASE in SQL.

---

## 5. Naming debt (client + edge Tier 1–2 complete)

**Active `src/` — prefer canonical names; aliases kept for `@/legacy` only:**

| Canonical | Deprecated alias (keep) |
|-----------|-------------------------|
| `MarketQuote` | `BtcPriceData` |
| `fetchMarketData` | `fetchBtcData` |
| `formatMarketPrice` | `formatBtcPrice` |
| `MarketMoveSeverity` / `severityFromMarketChangePercent` | `BtcMoveSeverity` / `severityFromBtcChangePercent` |
| `marketData` | `btcData` on pause home context |
| `MarketStatus` / `MarketChart` | `BtcStatus` / `BtcChart` |
| `buildPauseContextFromMarket` | `buildPauseContextFromBtc` |
| `getCoingeckoSpotPriceUsd*` | `getCoingeckoBtcUsd*` |
| `BREATHE_AMBIENT_MARKET_QUERY_KEY` | `BREATHE_AMBIENT_BTC_QUERY_KEY` |
| `marketInsight` / `resolveHistoricalMarketInsight()` | `btcInsight` dual-read on client + edge until DB backfill |
| `holzen_unit_basis_mode` | `holzen_btc_mode` localStorage dual-read |

**Edge Tier 1 (Jun 2026):** `_shared/market-on-this-day-*`, `market-price-warm.ts`, `historical-insight-wire.ts`; generators/fallbacks emit `marketInsight`; migration `20260607130000_historical_insight_market_insight_key.sql` rekeys stored fallbacks/cache rows.

**Edge Tier 2 (Jun 2026):** `market_price_cache` table (migration `20260607140000_market_price_cache_table.sql`); edge folders `refresh-market-prices`, `backfill-market-prices`, `seed-market-history`; cron job `refresh-market-prices` + `heartbeat.refresh_market_prices`; `_shared/market-price-cache-table.ts`.

**Still deferred:** `btcData` on `useHolzen()` / legacy pause home context (alias only); product copy strings that stay BTC-accurate for bitcoin-only (`unitBasisMode`, Look Back labels); BetterStack monitor rename from `holzen-cron-refresh-btc-prices` (wire new UUID to `heartbeat.refresh_market_prices` in ops).

**Tier 3 (Jun 2026):** `unit-basis-mode-storage` dual-read + Vitest; marketing i18n keys `landing.reserveLabel` / `about.reserveLabel` (replacing `btcReserve`; visible copy unchanged).

---

## 6. Verification checklist (future PR)

- [ ] Client + edge + migration allowlists match
- [ ] `npm run check:sql-search-path` on new migration
- [ ] Vitest: `tracked-assets.test.ts`, pause market context tests
- [ ] Manual: Settings asset control, onboarding, Home market widget, automatic trigger still fires for BTC
