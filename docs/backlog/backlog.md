# Backlog (Pending Improvements)

This folder collects items that we decided *not* to keep inside the phase review docs.

Rule of thumb used here:

- If something is fully addressed and stable, it gets removed from the audit trail doc (not duplicated in backlog).
- If something is still pending, it lives here (either in the category file and/or in this “everything” view).

---

## Quick finder (by theme)

| Theme | Backlog files |
|--------|----------------|
| **Platform, architecture & tooling** | [e2e-browser-automation.md](e2e-browser-automation.md), [spa-framework-evaluation.md](spa-framework-evaluation.md) |
| **Auth & routing** | [auth-referral.md](auth-referral.md), [route-gating.md](route-gating.md) |
| **Pause pipeline & client–server boundaries** | [pause-session-hydration.md](pause-session-hydration.md), [orchestrate-client-cron.md](orchestrate-client-cron.md), [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md), [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md), [cron-pause-featured-parity.md](cron-pause-featured-parity.md), [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) |
| **Cache, library & market data** | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md), [btc-price-cache-freshness.md](btc-price-cache-freshness.md), [cache-async-error-handling.md](cache-async-error-handling.md), [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) |
| **Rate limits, quality & observability** | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md), [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md), [quality-gates-false-positives.md](quality-gates-false-positives.md) |
| **Data consistency** | [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) |

**Companion / Signal design** (narrative + tables, not one-off tickets): [systems/pause/companions/signal.md §5](../systems/pause/companions/signal.md).

---

## Alphabetical index (file name → one-line)

| File | Summary |
|------|---------|
| [auth-referral.md](auth-referral.md) | Auth + referral side-effect robustness |
| [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | “Pause ready” vs orchestrate completion (`pause_notifications`) |
| [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | Historical BTC cache vs cron + Zoom Out |
| [cache-async-error-handling.md](cache-async-error-handling.md) | `.catch` on fire-and-forget cache helpers |
| [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Dedup for `content_library` / `companion_cache` |
| [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Transparency when cache serve relaxes constraints |
| [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Automatic vs manual pause featured fields / first paint |
| [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) | Cron worker auth aligned with [cron-setup.md](../ops/cron-setup.md) |
| [e2e-browser-automation.md](e2e-browser-automation.md) | Playwright/Cypress or Vitest+RTL; Bruno stays API-only |
| [orchestrate-client-cron.md](orchestrate-client-cron.md) | Client vs cron `companion-orchestrate` overlap |
| [pause-session-hydration.md](pause-session-hydration.md) | `/pause` when `location.state` is incomplete |
| [quality-gates-false-positives.md](quality-gates-false-positives.md) | `quality.ts` rejects; i18n / regex tuning |
| [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | Alert/metric when rate or daily budget fails open |
| [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | `analytics_events` vs `checkRateLimit` allowlist |
| [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md) | `holzen-reflect` OK, reflection insert fails |
| [route-gating.md](route-gating.md) | Strict route gating UX vs correctness |
| [spa-framework-evaluation.md](spa-framework-evaluation.md) | Vite SPA vs full-stack React framework (React docs tradeoffs; when to revisit) |
| [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) | Grounding dual-write: `reflection_companions` vs `reflections` |

---

## Pending items (flat list)

1. Guaranteed referral delivery (within retry policy) — [auth-referral.md](auth-referral.md)
2. UX clarity for strict route gating during auth loading — [route-gating.md](route-gating.md)
3. Reduce reliance on `location.state` for `/pause` restoration — [pause-session-hydration.md](pause-session-hydration.md)
4. Client vs cron `companion-orchestrate` overlap — measure, then dedup / cache policy — [orchestrate-client-cron.md](orchestrate-client-cron.md)
5. Partial failure: reflect OK, reflection insert fails — clearer handling or server-side atomic path — [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md)
6. Automatic pause: notification timing vs orchestrate completion — policy — [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md)
7. Cron vs manual pause: featured field parity and loading affordances — [cron-pause-featured-parity.md](cron-pause-featured-parity.md)
8. Cron worker auth: headers/secrets aligned across workers and ops docs — [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md)
9. `content_library` / `companion_cache` dedup — reduce near-duplicates — [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md)
10. BTC `btc_price_cache` historical freshness vs cron (Zoom Out contract) — [btc-price-cache-freshness.md](btc-price-cache-freshness.md)
11. Rate limit: `analytics_events` allowlist parity with generators — [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md)
12. `cache.ts` fire-and-forget paths: `.catch` for logging — [cache-async-error-handling.md](cache-async-error-handling.md)
13. Rate/daily budget fail-open: observability or policy — [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md)
14. Quality gates: false positives and localization — [quality-gates-false-positives.md](quality-gates-false-positives.md)
15. Cache serve relaxation: optional UX transparency — [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md)
16. Grounding dual-write consistency — Home vs pause — [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md)
17. E2E / browser automation for full product flows — [e2e-browser-automation.md](e2e-browser-automation.md)
18. **SPA vs full-stack React framework** — strategic evaluation (SSR/SSG/RSC, React team guidance); [spa-framework-evaluation.md](spa-framework-evaluation.md)
