# Market client architecture (target)

**Status:** scaffold (May 2026) — expand during Phase B slices  
**Audience:** engineers touching `src/features/market/` or Home market widget  
**Server authority:** `btc_price_cache`, volatility cron (`check-volatility`), threshold config — edges + Postgres  
**Template:** [pause-client-architecture.md](pause-client-architecture.md) §9  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)

---

## 1. Thesis

**Market is one bounded context** for BTC/volatility **context supply** to pause triggers and Home display. It does not own pause instances or ritual state.

---

## 2. Client rings

| Ring | Owns |
|------|------|
| **Feature** | Quote types, severity rules, fetch ports, display formatters |
| **Screens** | Home market widget JSX — data via `public` / `public-hooks` |
| **Pause (consumer)** | `pause-context-from-market`, home preview builders — import market `public` only |

---

## 3. Target interior (`src/features/market/`)

```text
features/market/
  domain/
    market-quote.ts
    btc-move-severity.ts
    volatility-thresholds.ts
    tracked-assets.ts
  application/use-cases/
    display/              # format-market-price, display telemetry
    context/              # pause-context-from-market, home preview
    cooldown/             # manual-cooldown rules
  ports/
    market-data.ts
  infrastructure/
    fetch-market-data.ts
    queries/              # coingecko, holzen display, ambient BTC
  presentation/
    use-market-display-preferences.ts
  public.ts | public-hooks.ts
```

Group by **market concern** (display vs context vs cooldown), not by “Home”.

---

## 4. Public API

| Barrel | Purpose |
|--------|---------|
| `public.ts` | Types, pure formatters, query key helpers |
| `public-hooks.ts` | Display preferences and market-facing hooks |
| `public-queries.ts` | *(optional)* if query modules peel out of public.ts |

---

## 5. Non-negotiables

1. **Trigger eligibility** — server cron + DB; client shows context, does not authorize volatility fires alone.
2. **Pause imports market** — not the reverse for ritual logic.
3. **External fetch** — CoinGecko / display adapters stay in `infrastructure/`.

---

## 6. Transitional state

Well-aligned relative to other contexts — see [src/features/market/README.md](../../src/features/market/README.md).

---

## 7. Related

- Pause home orchestration: `useHolzenHomeContextState` in pause presentation (composes market + pause)
- **Home market product logic (tiers, non-goals, experiments):** [home-market-logical-surface.md](../backlog/home-market-logical-surface.md)

---

## 8. Automatic pause trigger signal (server)

**Authority:** `check-volatility` edge + `profiles` threshold columns. Client displays context and frequency estimates; it does **not** decide eligibility.

### Shipped contract

| Signal | Window | Profile fields | Breach rule |
|--------|--------|----------------|-------------|
| Daily move | Rolling 24h | `threshold` (up), `threshold_down` (down) | Signed % change vs direction-specific threshold |
| Cumulative move | Rolling 7d | `cumulative_threshold` (default 15; `0` = off) | `abs(change_7d) ≥ threshold` |

Metrics come from CoinGecko `market_chart` in the cron worker (`fetchAssetVolatilityForCurrency`). Shared pure helpers: `supabase/functions/_shared/volatility-thresholds.ts` and `src/features/market/domain/volatility-thresholds.ts` (keep in sync).

Gating after breach: cooldown (`claim_trigger_slot`), quiet hours / `quiet_windows`, snooze, email/push prefs — see [notifications-delivery.md](notifications-delivery.md) and [phase-3-server-cron-triggers.md](../reviews/phase-3-server-cron-triggers.md).

### Why percent, not absolute price levels

Automatic offers target **volatility-driven checking**, not trading alerts at fixed spot prices. **Percentage deviation** stays meaningful as BTC spot drifts; absolute "$X" levels go stale and match a different product job.

**Decision record:** [2026-06-03-percent-volatility-triggers.md](../decisions/2026-06-03-percent-volatility-triggers.md).

**Future (optional):** personal anchor thresholds (entry, round numbers) layered **on top of** % logic — [volatility-anchor-thresholds.md](../backlog/volatility-anchor-thresholds.md).

---

## 9. Tracked asset catalog (multi-class prep)

**Shipped:** bitcoin only in `TRACKED_ASSETS` — see `src/features/market/domain/tracked-assets.ts`.

**Model:** `TrackedAssetDefinition` (`id`, `symbol`, `kind`, `provider`) + `profiles.tracked_asset_id` as provider-native string. **Quote type:** prefer `MarketQuote`; `BtcPriceData` is a deprecated alias.

**BTC-only product features** should use `isBitcoinTrackedAsset()` (on-chain, unit display mode, zoom-out anniversary). Active call sites use the helper in client fetch, pause context, Settings, Home, and edge `check-volatility` / `market-quote` / zoom-out.

**Full 360° gap analysis and rollout steps:** [tracked-asset-class-evolution.md](../backlog/tracked-asset-class-evolution.md).
