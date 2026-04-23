# Pause V2 post-cutover monitoring

Use this doc for the first **7 days** after Phase J (flag flip). After
that window, if no alerts fired and all queries are green,
[Phase L](pause-v2-cutover-runbook.md#6-rollback) is unblocked — the
legacy `reflections` runtime + the `pause_v2_enabled` flag can be
removed.

Responsible: Holzen maintainer. Related:
[pause-v2-cutover-runbook.md](pause-v2-cutover-runbook.md),
[pause-system.md](../systems/pause-system.md).

## 1. Core invariants

Run each query daily. All three should return 0 rows.

### 1.1 At most one open pause per user

```sql
SELECT user_id, count(*) AS open_pauses
FROM public.pause_instances
WHERE state IN ('active','engaged')
GROUP BY 1
HAVING count(*) > 1;
```

### 1.2 No terminal pause has null terminal_at

```sql
SELECT id, state, completed_at, terminal_at
FROM public.pause_instances
WHERE state IN ('completed','dismissed','expired')
  AND terminal_at IS NULL;
```

### 1.3 No non-completed pause has completed_at

```sql
SELECT id, state, completed_at
FROM public.pause_instances
WHERE state <> 'completed'
  AND completed_at IS NOT NULL;
```

## 2. Rate + ratio watch

### 2.1 Pauses created per day — compare to legacy volume

```sql
SELECT day,
       sum(created)   AS created,
       sum(engaged)   AS engaged,
       sum(completed) AS completed,
       sum(expired)   AS expired
FROM public.v_pause_metrics_daily
WHERE day >= current_date - interval '14 days'
GROUP BY day
ORDER BY day DESC;
```

Compare `created` to the prior legacy baseline (`v_notification_response_rate`).
±10% is normal; -20% or more means we're missing a creation path.

### 2.2 Completion + engagement rates

```sql
SELECT
  sum(created)   AS created,
  sum(engaged)   AS engaged,
  sum(completed) AS completed,
  round(100.0 * sum(engaged)::numeric   / nullif(sum(created), 0), 1) AS engagement_pct,
  round(100.0 * sum(completed)::numeric / nullif(sum(created), 0), 1) AS completion_pct
FROM public.v_pause_metrics_daily
WHERE day >= current_date - interval '7 days';
```

Pre-cutover baseline: the legacy `v_notification_response_rate`'s
`pct_completed` + `pct_engaged` values. A drop > 20% vs. legacy is a
red flag — investigate before Phase L.

### 2.3 Expiration-reason distribution

```sql
SELECT day,
       sum(expired_context_lost)   AS context_lost,
       sum(expired_window_elapsed) AS window_elapsed,
       sum(expired_superseded)     AS superseded,
       sum(expired_ineligible)     AS ineligible,
       sum(expired_system_cancelled) AS system_cancelled
FROM public.v_pause_metrics_daily
WHERE day >= current_date - interval '7 days'
GROUP BY day
ORDER BY day DESC;
```

Expected: `context_lost` + `window_elapsed` dominate. Spikes in
`system_cancelled` or `ineligible_user_state` point at bugs.

## 3. Bell deduplication

### 3.1 No user has two active 'pause' notifications at once

```sql
SELECT user_id, count(*) AS active_pause_notifs
FROM public.notifications
WHERE type = 'pause'
  AND dismissed_at IS NULL
GROUP BY 1
HAVING count(*) > 1;
```

If this returns rows, the legacy trigger didn't skip properly (check
`pause_v2_enabled` via `SELECT value FROM app_config WHERE key='feature_flags';`)
or the supersede branch in `notifications_from_pause_instances` isn't
deleting the legacy row.

### 3.2 No dangling bell entry for a terminal pause

```sql
SELECT n.id, pi.state, n.dismissed_at
FROM public.notifications n
JOIN public.pause_instances pi
  ON pi.id = n.source_id
WHERE n.source_table = 'pause_instances'
  AND pi.state IN ('completed','dismissed','expired')
  AND n.dismissed_at IS NULL;
```

Should be empty — the UPDATE trigger stamps `dismissed_at` on state
terminalization.

## 4. Companion counting sanity

### 4.1 Non-counting reason distribution

```sql
SELECT non_counting_reason, count(*)
FROM public.pause_companion_events
WHERE action = 'complete'
  AND counts_for_pause = false
  AND created_at >= current_date - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC;
```

Expected distribution:
- `no_active_pause` — highest (library/bell completions).
- `outside_window` / `context_lost` — low but non-zero.
- `already_counted` — very low (indicates double-taps).
- `not_allowed_for_template` — should be near zero (indicates a client
  passing an unexpected companion_type).

### 4.2 Counted completions per completed pause

```sql
SELECT counted_companion_count, count(*)
FROM public.v_pause_full
WHERE state = 'completed'
  AND completed_at >= current_date - interval '7 days'
GROUP BY 1 ORDER BY 1;
```

Every row should be ≥ 1 (strict completion requires at least one
counted companion by the `volatility_v1` template).

## 5. Sentry + BetterStack + PostHog pivots

Use `pause_instance_id` as the primary pivot:

- **Sentry**: filter by `tags.pause_instance_id` (set by the edge + hook
  error handlers). Issues tagged there should all resolve within 1h;
  if a specific instance_id is generating repeated errors, drill into
  the corresponding `pause_instances` row.
- **BetterStack**: filter `"pause_v2"` for V2-specific log lines. Expect
  `pause_v2 instance created`, `pause_v2 reuse (fingerprint_match)`.
  Zero `pause_v2 parallel write threw` is healthy.
- **PostHog**: query on the new events — `pause_instance_created`,
  `pause_engaged`, `pause_completed`, `pause_expired`,
  `pause_companion_counted`, `pause_companion_not_counted`. Add these
  to the canonical event list in
  [docs/ops/event-taxonomy.md](event-taxonomy.md) during Phase M's
  doc sweep.

## 6. Thresholds for rollback (7-day window)

Roll back (`SELECT cutover_flip_pause_v2(false);`) if **any**:

- Invariant query in §1 returns rows on two consecutive daily checks.
- Completion rate drops > 20% vs. legacy baseline on two consecutive
  days.
- Double-notification rate (§3.1) rows > 1% of DAUs.
- Sentry issues tagged `pause_instance_id` spike > 10x normal error
  rate.

After rollback, file a postmortem in `docs/postmortems/` describing
the specific failing query + the fix. Fix must ship + go green on
staging before re-attempting the cutover.

## 7. Green-light criteria for Phase L

All of the following must hold continuously for **14 days**
post-cutover before we drop the legacy tables:

- All §1 invariants return 0 rows every day.
- Completion rate within ±10% of legacy baseline.
- Companion non-counting-reason distribution matches §4.1 expected
  shape.
- Zero Sentry issues in the `pause_v2` tag set unresolved > 24h.
- Zero BetterStack `pause_v2 parallel write threw` lines in the last
  7 days.

When all green, proceed with
[Phase L hard-delete](pause-v2-cutover-runbook.md#7-what-to-watch-in-the-first-24h).
