# Percent-based volatility triggers (not absolute price levels)

**Date:** 2026-06-03  
**Status:** accepted

## Context

Automatic pause offers from **`check-volatility`** fire when a user's configured **move thresholds** are breached. The shipped signal is **relative**:

- **24h move:** `(current − price_24h_ago) / price_24h_ago × 100`, compared to `profiles.threshold` (up) and `profiles.threshold_down` (down).
- **7d cumulative move:** same formula over seven days, compared to `profiles.cumulative_threshold` (default 15%; `0` disables).

Alternatives we discussed:

1. **Absolute price levels** — fire when price goes above or below a fixed number (e.g. "$60k", "$100k").
2. **Hybrid** — keep % triggers and add optional personal anchors (entry price, round numbers, "% from my cost basis").
3. **Other relative measures** — dollar move for fixed holdings, ATR/regime-aware thresholds, drawdown from local high.

Holzen's wedge is **volatility-driven checking and distress**, not trading alerts. The question was whether % deviation over 24h/7d is the right *primary* measure.

## Decision

Keep **percentage deviation over rolling windows** as the **only** automatic trigger signal for MVP.

Rationale:

| Factor | Why % wins for this product |
|--------|----------------------------|
| **User mental model** | People describe stress as "BTC is down 8% today," not "BTC crossed $67,432." |
| **Scale invariance** | A 5% threshold stays roughly meaningful as spot price drifts; fixed levels go stale. |
| **Settings UX** | One number per direction; no re-tuning after every bull/bear regime. |
| **Data path** | CoinGecko `market_chart` → rolling % is already what cron and Home estimator use. |
| **Asymmetry** | Separate up/down thresholds match asymmetric anxiety (often worse on drops). |
| **Product boundary** | Absolute levels are closer to **portfolio/trading alerts**; pause offers target **rate-of-change stress**. |

**Not chosen as primary:**

- **Fixed above/below X** — wrong default for "market moved enough to spike checking"; levels need ongoing maintenance and feel like a different feature.
- **Replacing % with levels** — would shift cron semantics and settings copy without improving the core volatility-interruption story.

Known limitations (accepted for now):

- Rolling 24h can miss slow bleeds until late, or fire on sharp wicks that recover.
- Same % ≠ same felt impact for users with different position sizes (dollar P&L differs at different spot prices).
- Fingerprints bucket % to whole points (see [pause-system.md §5.2](../systems/pause-system.md)) — sub-point noise must not churn offers.

## Consequences

- **Positive:** Explainable settings ("5% down in 24h"), stable across BTC price regimes, aligned with reflect-step context strings and severity bands.
- **Negative:** Users whose stress is anchored to **personal price lines** (entry, round numbers, liquidation proximity) are not fully served until optional anchors ship.
- **Follow-ups:** Optional **anchor thresholds** (hybrid) — see [volatility-anchor-thresholds.md](../backlog/volatility-anchor-thresholds.md). Do **not** replace % logic; layer on if product validates demand.

## Alternatives considered

| Alternative | Verdict |
|-------------|---------|
| Absolute above/below X only | Rejected as primary — trading-alert semantics; stale levels over time. |
| Hybrid (% **or** anchor) | Deferred — best incremental upgrade; backlog ticket. |
| Dollar move for fixed holdings | Deferred — needs position size; heavy settings. |
| ATR / regime-aware % | Deferred — harder to explain in Settings; possible later tuning. |
| Drawdown from 7d high | Partially covered by cumulative 7d % threshold today. |

## References

- Implementation: `supabase/functions/check-volatility/index.ts`, `supabase/functions/_shared/volatility-thresholds.ts`, `src/features/market/domain/volatility-thresholds.ts`
- UI estimator (same rules): `src/screens/home/components/ThresholdFrequencyEstimator.tsx`
- Calm-market / fingerprint: [pause-system.md §5.2](../systems/pause-system.md)
- Market context layout: [market-client-architecture.md §8](../systems/market-client-architecture.md)
- Phase 3 cron review: [phase-3-server-cron-triggers.md](../reviews/phase-3-server-cron-triggers.md)
