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
| `MarketQuote` type alias | `BtcPriceData` retained as deprecated alias for incremental rename |
| Settings | Asset picker hidden when catalog length is 1 (read-only label) |
| i18n | Removed ETH/SOL/XMR settings labels |

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

### Bitcoin-specific (gate on `isBitcoinTrackedAsset()`)

| Feature | Location (representative) |
|---------|---------------------------|
| On-chain block (mempool, fees) | `fetch-market-data.ts`, `OnChainData` |
| Home “BTC unit” display mode | `use-market-display-preferences.ts`, market widget |
| Zoom-out anniversary companion copy | edge `companion-orchestrate` / zoom-out tasks |
| `BtcMoveSeverity`, `formatBtcPrice`, `fetchBtcData` naming | market feature — rename to `Market*` incrementally |
| `btc_price_cache` table name | server cache keyed by asset today; rename optional later |
| Fear & Greed index | crypto-wide today; may stay crypto-only or become optional per kind |

### Not prepared (explicit deferrals)

| Gap | Why |
|-----|-----|
| **Multiple assets per user** | Single `tracked_asset_id` column; Home widget, thresholds, pause copy assume one |
| **Equity quote provider** | No port implementation; CoinGecko-only infrastructure |
| **Asset kind in DB** | Kind lives in client/edge catalog only — add `tracked_assets` reference table if catalog grows |
| **Trading hours / market calendars** | Volatility cron assumes 24/7 crypto charts |
| **Regulatory copy per asset class** | Product/legal not scoped |

---

## 4. Recommended migration path (when adding an asset)

1. Add row to `TRACKED_ASSETS` (client) + `_shared/tracked-assets.ts` + `update_profile_safe` CASE in **one PR**.
2. Confirm `fetchMarketData` / cron chart fetch supports the provider id (CoinGecko path already generic).
3. Gate BTC-only UI with `isBitcoinTrackedAsset(trackedAssetId)` — do not branch on string literals scattered in screens.
4. Add i18n `settings.trackedAssets.{id}` and onboarding copy if user-selectable.
5. PostHog: keep `tracked_asset_id` property on relevant events (already sanitized string).

For **equities**, expect a new `AssetQuoteProvider` value, a `ports/market-data` adapter, and likely a **reference table** instead of a growing CASE in SQL.

---

## 5. Naming debt (incremental, not blocking)

Prefer new code:

- `MarketQuote` over `BtcPriceData` (alias retained)
- `fetchMarketData` over `fetchBtcData` (alias retained)
- `formatMarketPrice` over `formatBtcPrice` (alias retained)
- `MarketMoveSeverity` / `severityFromMarketChangePercent` over `BtcMoveSeverity` / `severityFromBtcChangePercent` (aliases retained)
- `marketData` over `btcData` on pause home context (`btcData` alias kept for `@/legacy` only)
- `MarketStatus` / `MarketChart` over `BtcStatus` / `BtcChart` (deprecated component aliases on new files)

Remaining optional: `btcMode` (product-specific unit display), `btc-on-this-day` pause ritual block, `btc_price_cache` table name.

---

## 6. Verification checklist (future PR)

- [ ] Client + edge + migration allowlists match
- [ ] `npm run check:sql-search-path` on new migration
- [ ] Vitest: `tracked-assets.test.ts`, pause market context tests
- [ ] Manual: Settings asset control, onboarding, Home market widget, automatic trigger still fires for BTC
