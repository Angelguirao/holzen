# Backlog (Pending Improvements)

This folder collects items that we decided *not* to keep inside the phase review docs.

Rule of thumb used here:
- If something is fully addressed and stable, it gets removed from the audit trail doc (not duplicated in backlog).
- If something is still pending, it lives here (either in the category file and/or in this “everything” view).

## Categories

- `auth-referral` — pending auth + referral side-effect robustness items
  - See: `auth-referral.md`
- `route-gating` — auth/routing UX vs correctness tradeoffs
  - See: `route-gating.md`
- `pause-session-hydration` — pause entry contract robustness when navigation state is incomplete
  - See: `pause-session-hydration.md`
- `orchestrate-client-cron` — duplicate work / races between client and cron calling `companion-orchestrate`
  - See: `orchestrate-client-cron.md`
- `reflection-insert-partial-failure` — holzen-reflect succeeds but DB insert fails (manual path)
  - See: `reflection-insert-partial-failure.md`
- `automatic-pause-notification-timing` — when to show "pause ready" vs wait for orchestrate (`pause_notifications` ordering)
  - See: `automatic-pause-notification-timing.md`
- `cron-pause-featured-parity` — featured fields / first paint parity for automatic vs manual pauses
  - See: `cron-pause-featured-parity.md`
- `cron-worker-auth-consistency` — align cron worker auth gates with `docs/ops/cron-setup.md`
  - See: `cron-worker-auth-consistency.md`
- `cache-dedup-near-duplicates` — stronger dedup for `content_library` and `companion_cache`
  - See: `cache-dedup-near-duplicates.md`
- `btc-price-cache-freshness` — historical BTC cache staleness vs cron cadence + Zoom Out expectations
  - See: `btc-price-cache-freshness.md`
- `rate-limit-analytics-allowlist` — analytics events match `checkRateLimit` allowlist
  - See: `rate-limit-analytics-allowlist.md`
- `cache-async-error-handling` — `.catch` on fire-and-forget cache helpers
  - See: `cache-async-error-handling.md`

## Pending items (everything)

- 1. Guaranteed referral delivery (within retry policy) (`auth-referral.md`)
- 2. UX clarity for strict route gating during auth loading (`route-gating.md`)
- 3. Reduce reliance on `location.state` for `/pause` restoration (`pause-session-hydration.md`)
- 4. Client vs cron `companion-orchestrate` overlap — measure, then dedup / cache policy (`orchestrate-client-cron.md`)
- 5. Partial failure: reflect OK, reflection insert fails — clearer error handling or server-side atomic path (`reflection-insert-partial-failure.md`)
- 6. Automatic pause: notification timing vs orchestrate completion — policy (await, enrich payload, or keep async) (`automatic-pause-notification-timing.md`)
- 7. Cron vs manual pause: featured field parity and loading affordances on first paint (`cron-pause-featured-parity.md`)
- 8. Cron worker auth: headers/secrets aligned across workers and ops docs (`cron-worker-auth-consistency.md`)
- 9. `content_library` / `companion_cache` dedup — reduce near-duplicates (`cache-dedup-near-duplicates.md`)
- 10. BTC `btc_price_cache` historical freshness vs cron (Zoom Out contract) (`btc-price-cache-freshness.md`)
- 11. Rate limit: `analytics_events` allowlist parity with generators (`rate-limit-analytics-allowlist.md`)
- 12. `cache.ts` fire-and-forget paths: `.catch` for logging (`cache-async-error-handling.md`)

