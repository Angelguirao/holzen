# Optional anchor thresholds (price levels & cost basis)

**Status:** Backlog (2026-06).  
**Decision context:** [2026-06-03-percent-volatility-triggers.md](../decisions/2026-06-03-percent-volatility-triggers.md) — **% deviation stays primary**; this ticket is for a **future additive** layer.

---

## Problem

Some users' checking spikes are tied to **personal anchors**, not generic volatility:

- Cost basis / average entry ("I panic below where I bought")
- Round-number psychology ($100k, $50k)
- Self-defined floor or ceiling ("my line in the sand")

Today's cron only evaluates **24h / 7d % moves** against `threshold`, `threshold_down`, and `cumulative_threshold`. That is intentional for the volatility-interruption wedge; it does not cover anchor-driven stress.

## Proposal (when prioritized)

Add **optional** profile fields and gating — fire automatic pause when **either**:

1. Existing **% thresholds** breach (unchanged), **or**
2. New **anchor rule(s)** breach (user-configured, off by default).

Example anchor shapes (pick one MVP slice — do not ship all at once):

| Anchor type | Trigger idea | Settings burden |
|-------------|--------------|-----------------|
| **Fixed level** | Price crosses above/below user-set USD (or display currency) level | Low — one number + direction |
| **Distance from entry** | Spot within Y% of stored entry price (from hold goal / manual entry) | Medium — needs trusted entry source |
| **Round-number proximity** | Within Z% of nearest $10k / $5k band | Low — preset bands, no free-form level |

Recommended **first slice:** fixed level **or** "within X% of my entry" — not both in v1.

## Non-goals

- Replacing % thresholds as the default product story.
- Sub-daily trading alerts, stop-loss automation, or exchange webhooks.
- Client-only trigger authority — eligibility must remain **server-side** (`check-volatility` + RLS-safe profile fields).

## Implementation sketch

| Layer | Work |
|-------|------|
| **Schema** | New nullable columns on `profiles` (e.g. `anchor_price`, `anchor_direction`, `anchor_band_pct`) + `update_profile_safe` allowlist |
| **Cron** | Extend `isVolatilityThresholdBreached` (or sibling) in `_shared/volatility-thresholds.ts`; include anchor in context string for LLM |
| **Client** | Settings UI in user feature; extend `ThresholdFrequencyEstimator` simulation if anchors affect frequency preview |
| **Fingerprint** | Decide whether crossing an anchor changes `context_fingerprint` regime keys in [pause-system.md §5.2](../systems/pause-system.md) |
| **Docs / analytics** | [event-taxonomy.md](../ops/event-taxonomy.md) if new settings events; update ADR consequences when shipped |

## Acceptance criteria (draft)

- [ ] Anchor rules are **opt-in**; default off — existing users unchanged.
- [ ] Server cron evaluates anchors with same gates (cooldown, quiet hours, snooze).
- [ ] Calm-market sweep semantics documented if anchor can "clear" without % calm.
- [ ] Settings copy distinguishes **"market moved %"** vs **"near my price line"**.
- [ ] Unit tests mirror `volatility-thresholds.test.ts` patterns on client + `_shared`.

## Open questions

1. **Entry price source:** `hold_goal` legacy fields vs new explicit `cost_basis` — active surface may limit what we can read.
2. **Currency:** anchor in user's `hold_goal_currency` vs always USD for BTC.
3. **One-shot vs sustained:** fire once on cross, or while price stays beyond anchor?
4. **Interaction with cumulative 7d %:** OR logic only, or require both for "double stress" deep offers?

## Related

- [market-client-architecture.md §8](../systems/market-client-architecture.md)
- [phase-3-server-cron-triggers.md](../reviews/phase-3-server-cron-triggers.md)
- [behavioral-platform-strategy.md § Market context](../fundamentals/behavioral-platform-strategy.md)
