# Backlog (Pending Improvements)

This folder collects items that we decided *not* to keep inside the phase review docs.

Rule of thumb used here:

- If something is fully addressed and stable, it gets removed from the audit trail doc (not duplicated in backlog).
- If something is still pending, it lives here (either in the category file and/or in this “everything” view).

---

## How to use this backlog

| You want to… | Start with |
|--------------|------------|
| **Grab a concrete engineering task** | [Work queue (pick by goal)](#work-queue-pick-by-goal) — groups tickets by *why* you’d work on them. |
| **Work in a product area** | [Quick finder (by theme)](#quick-finder-by-theme) — pause, cache, auth, etc. |
| **Look up a file name** | [Alphabetical index](#alphabetical-index-file-name--one-line). |
| **See every ticket in one table** | [Master table (all items)](#master-table-all-items). |

**Companion / Signal design** (narrative + tables, not a one-off ticket): [systems/pause/companions/signal.md §5](../systems/pause/companions/signal.md).

---

## Work queue (pick by goal)

Use this when you are **choosing what to work on next**. Items are **not** strictly ordered; “priority hint” is a rough **impact / urgency** label (not a formal SLA).

### Correctness & data integrity (fix wrong or inconsistent state)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| High | [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md) | `holzen-reflect` succeeds but `reflections` insert fails — UI/DB can disagree. |
| High | [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) | Grounding dual-write: `reflection_companions` vs `reflections` / Home. |
| Medium | [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | Historical BTC cache vs cron cadence + Zoom Out expectations. |

### Reliability & edge cases (fewer surprises under load or odd navigation)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [pause-session-hydration.md](pause-session-hydration.md) | `/pause` when `location.state` is incomplete — align with profile/hooks. |
| Medium | [auth-referral.md](auth-referral.md) | Referral side-effect delivery within retry policy. |

### Observability & limits (know when things fail open; align metrics with throttles)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | Alert/metric when rate or daily budget checks fail open. |
| Medium | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | `analytics_events` allowlist parity with `checkRateLimit` + generators. |
| Medium | [cache-async-error-handling.md](cache-async-error-handling.md) | `.catch` on fire-and-forget cache helpers for logging. |

### Cost & duplicate work (same user/session doing redundant orchestration or cache churn)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [orchestrate-client-cron.md](orchestrate-client-cron.md) | Client vs cron `companion-orchestrate` overlap — measure, dedup, cache policy. |
| Lower | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Stronger dedup for `content_library` / `companion_cache`. |

### Product / UX (what the user sees or feels)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | “Pause ready” vs orchestrate completion (`pause_notifications`). |
| Medium | [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Automatic vs manual pause featured fields / first paint. |
| Medium | [route-gating.md](route-gating.md) | Strict route gating UX vs correctness during auth loading. |
| Lower | [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Transparency when cache serve relaxes constraints. |

### Ops & security (cron workers, secrets, docs alignment)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) | Cron worker auth aligned with [cron-setup.md](../ops/cron-setup.md). |

### Quality gates & content (reject noise, tune prompts)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Medium | [quality-gates-false-positives.md](quality-gates-false-positives.md) | `quality.ts` false positives; i18n / regex tuning. |

### Testing & tooling (confidence before refactors)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Enabler | [e2e-browser-automation.md](e2e-browser-automation.md) | **UI / journeys:** click-through pause, journal, etc. — Playwright/Cypress or Vitest+RTL; Bruno is **not** browser automation (API review only). |

### Strategic (not a sprint task — revisit when product/hosting needs change)

| Priority hint | Ticket | Summary |
|---------------|--------|---------|
| Defer | [spa-framework-evaluation.md](spa-framework-evaluation.md) | Vite SPA vs full-stack React framework (SSR/SSG/RSC); when to reconsider. |

---

## Master table (all items)

Sortable mentally by **Work type** column; links go to the full ticket.

| Work type | Ticket | One-line |
|-----------|--------|----------|
| Correctness | [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md) | Reflect OK, reflection insert fails |
| Data integrity | [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md) | Grounding dual-write Home vs pause |
| Data / market | [btc-price-cache-freshness.md](btc-price-cache-freshness.md) | BTC cache freshness vs Zoom Out |
| Reliability | [pause-session-hydration.md](pause-session-hydration.md) | `/pause` without full navigation state |
| Reliability | [auth-referral.md](auth-referral.md) | Referral delivery robustness |
| Observability | [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md) | Fail-open rate/budget visibility |
| Observability | [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md) | Analytics vs allowlist parity |
| Observability | [cache-async-error-handling.md](cache-async-error-handling.md) | Fire-and-forget cache `.catch` |
| Cost / efficiency | [orchestrate-client-cron.md](orchestrate-client-cron.md) | Client vs cron orchestrate overlap |
| Cost / efficiency | [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md) | Near-duplicate cache entries |
| Product / UX | [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md) | Notification vs orchestrate ordering |
| Product / UX | [cron-pause-featured-parity.md](cron-pause-featured-parity.md) | Cron vs manual featured parity |
| Product / UX | [route-gating.md](route-gating.md) | Auth loading + route gating UX |
| Product / UX | [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md) | Cache relaxation transparency |
| Ops / security | [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md) | Worker auth vs docs |
| Quality | [quality-gates-false-positives.md](quality-gates-false-positives.md) | Quality gate tuning |
| Testing | [e2e-browser-automation.md](e2e-browser-automation.md) | UI journeys (E2E) vs Bruno API review |
| Strategic | [spa-framework-evaluation.md](spa-framework-evaluation.md) | SPA vs framework evaluation |

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

## Pending items (numbered reference)

Legacy numeric IDs for chat / PR references; prefer **ticket file name** or [master table](#master-table-all-items) for new work.

1. Guaranteed referral delivery — [auth-referral.md](auth-referral.md)
2. UX clarity for strict route gating during auth loading — [route-gating.md](route-gating.md)
3. Reduce reliance on `location.state` for `/pause` restoration — [pause-session-hydration.md](pause-session-hydration.md)
4. Client vs cron `companion-orchestrate` overlap — [orchestrate-client-cron.md](orchestrate-client-cron.md)
5. Partial failure: reflect OK, reflection insert fails — [reflection-insert-partial-failure.md](reflection-insert-partial-failure.md)
6. Automatic pause: notification timing vs orchestrate completion — [automatic-pause-notification-timing.md](automatic-pause-notification-timing.md)
7. Cron vs manual pause: featured field parity — [cron-pause-featured-parity.md](cron-pause-featured-parity.md)
8. Cron worker auth — [cron-worker-auth-consistency.md](cron-worker-auth-consistency.md)
9. `content_library` / `companion_cache` dedup — [cache-dedup-near-duplicates.md](cache-dedup-near-duplicates.md)
10. BTC `btc_price_cache` historical freshness — [btc-price-cache-freshness.md](btc-price-cache-freshness.md)
11. Rate limit: `analytics_events` allowlist parity — [rate-limit-analytics-allowlist.md](rate-limit-analytics-allowlist.md)
12. `cache.ts` fire-and-forget `.catch` — [cache-async-error-handling.md](cache-async-error-handling.md)
13. Rate/daily budget fail-open observability — [rate-budget-fail-open-observability.md](rate-budget-fail-open-observability.md)
14. Quality gates: false positives — [quality-gates-false-positives.md](quality-gates-false-positives.md)
15. Cache serve relaxation UX — [cache-serve-relaxation-ux.md](cache-serve-relaxation-ux.md)
16. Grounding dual-write consistency — [writeCompanionData-grounding-consistency.md](writeCompanionData-grounding-consistency.md)
17. E2E / browser automation — [e2e-browser-automation.md](e2e-browser-automation.md)
18. SPA vs full-stack React framework — [spa-framework-evaluation.md](spa-framework-evaluation.md)
