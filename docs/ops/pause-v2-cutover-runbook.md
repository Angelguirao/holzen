# Pause V2 cutover runbook

Use this checklist to take Holzen from legacy pauses (reflections-as-
pause) to Pause V2 (pause_instances + events + artifacts). The cutover
is a single flag flip (`app_config.feature_flags.pause_v2_enabled` ->
`true`) plus a baseline reset (`TRUNCATE user_badges`). Every surface
has been coded to dual-write / dual-read behind the flag, so the only
user-visible moment is when the flag goes true.

Document owner: Holzen maintainer. See
[docs/systems/pause-system.md](../systems/pause-system.md) for the
model, [PLAN.md](/opt/cursor/artifacts/PLAN.md) for the full migration
plan.

## 0. Pre-flight (staging)

1. **Sync latest main into staging** via the usual Lovable + GitHub
   flow. Confirm the migrations land:
   - `supabase/migrations/20260423200700_pause_types_and_instances.sql`
   - `supabase/migrations/20260423200710_pause_events.sql`
   - `supabase/migrations/20260423200720_pause_ai_artifacts.sql`
   - `supabase/migrations/20260423200730_pause_transition_engine.sql`
   - `supabase/migrations/20260423200740_pause_views.sql`
   - `supabase/migrations/20260423200750_pause_seed_template.sql`
   - `supabase/migrations/20260423201000_pause_rpc_functions.sql`
   - `supabase/migrations/20260423202000_pause_v2_feature_flag.sql`
   - `supabase/migrations/20260423203000_pause_v2_notifications_and_library.sql`

2. **Verify the seed template landed:**
   ```sql
   SELECT slug, window_ms, required_for_engaged, required_for_completed, required_companion_count
   FROM public.pause_templates
   WHERE slug = 'volatility_v1';
   ```
   Expected: one row with `window_ms = 21_600_000`, gates as per
   [pause-system.md §4](../systems/pause-system.md).

3. **Verify the flag defaults OFF:**
   ```sql
   SELECT value->'pause_v2_enabled' FROM public.app_config
   WHERE key = 'feature_flags';
   ```
   Expected: `false`.

4. **Verify no user has >1 open pause** (there shouldn't be yet, but
   it's the invariant we're about to lean on):
   ```sql
   SELECT user_id, count(*) FROM public.pause_instances
   WHERE state IN ('active','engaged')
   GROUP BY 1 HAVING count(*) > 1;
   ```
   Expected: 0 rows.

## 1. Flip the flag on staging

```sql
UPDATE public.app_config
   SET value = jsonb_set(value, '{pause_v2_enabled}', 'true'::jsonb),
       updated_at = now()
 WHERE key = 'feature_flags';
```

## 2. Smoke test (staging)

Do each of the following on a dedicated staging test account. Pause V2
must remain idempotent under every step.

### 2.1 Manual pause creation

1. Open Home.
2. Tap "Need a moment".
3. Confirm: reflection copy renders, companions render, Home library
   "Current pause" card appears.
4. Query:
   ```sql
   SELECT state, source, context_fingerprint
   FROM public.pause_instances
   WHERE user_id = '<UID>' ORDER BY created_at DESC LIMIT 1;
   ```
   Expected: `state='active'`, `source='manual'`.
5. Query artifacts:
   ```sql
   SELECT kind, jsonb_path_exists(content, '$.message')
   FROM public.pause_ai_artifacts
   WHERE pause_instance_id = '<INSTANCE_ID>';
   ```
   Expected: one row per returned companion (`reflection_text`, plus
   `haiku` + `ground_nudge` when enabled).

### 2.2 Step events drive state

1. Walk the pause flow: Breath -> Feel -> Reflect (open a companion) ->
   Shift -> Decide.
2. Query events:
   ```sql
   SELECT step_type, payload, created_at
   FROM public.pause_step_events
   WHERE pause_instance_id = '<INSTANCE_ID>'
   ORDER BY created_at;
   ```
   Expected: exactly one row per step: `breath_completed` (no
   payload), `initial_emotion_logged` (payload.mood), `shift_emotion_logged`
   (payload.mood), `outcome_logged` (payload.outcome), optional
   `favorite_toggled`.
3. Query companions:
   ```sql
   SELECT companion_type, action, counts_for_pause, non_counting_reason
   FROM public.pause_companion_events
   WHERE pause_instance_id = '<INSTANCE_ID>'
   ORDER BY created_at;
   ```
   Expected: the companion(s) you opened have `action='complete'` +
   `counts_for_pause=true`.
4. Query state:
   ```sql
   SELECT state, engaged_at, completed_at, terminal_at
   FROM public.pause_instances
   WHERE id = '<INSTANCE_ID>';
   ```
   Expected: `state='completed'`, `completed_at` set, `engaged_at` set,
   `terminal_at=completed_at`.

### 2.3 Bell + Library current-pause card

1. Trigger a new manual pause.
2. Before engaging, open the bell (top-right): the new pause should
   appear exactly once (the legacy trigger is skipped when the flag is
   on).
3. Open Library: the top "Current pause" card should display with the
   correct preview text and "open until" timestamp.
4. Tap the card -> PauseSession should open with the correct instance
   id (check the `pauseInstanceId` in the step event rows for this
   session).

### 2.4 Cron idempotency (fingerprint match)

1. Manually invoke `check-volatility` twice in quick succession for a
   user with thresholds currently met.
2. Query:
   ```sql
   SELECT id, state, context_fingerprint, created_at
   FROM public.pause_instances
   WHERE user_id = '<UID>' ORDER BY created_at DESC LIMIT 3;
   ```
   Expected: at most ONE `state='active'` row; the second invocation
   should be a no-op on V2 (log: `pause_v2 reuse (fingerprint_match)`).

### 2.5 Context-lost expiry

1. With an active pause, simulate a regime change by updating the
   user's last-reported context or manually invoking `check-volatility`
   with a different fingerprint.
2. Expected: the old instance transitions to `expired` with
   `expired_reason='context_lost'` and `superseded_by` set to the new
   instance id. The new instance is `state='active'`.

### 2.6 Stats V2 renders

1. Open Profile > Stats.
2. Confirm the new `StatsContentV2` layout: Skill Overview -> Skill
   Deep Dives -> Journey & Consistency -> Advanced.
3. Confirm the hero card shows Holzen Score + 5 skill bars.
4. Confirm the confidence chip shows something reasonable (expect
   "insufficient" until at least 3 completed pauses).
5. If the user has no hold goal, Alignment renders a CTA row, NOT a
   synthetic score bar.

### 2.7 Badges V2 renders

1. Open Profile > Badges.
2. Confirm 4 family sections in order: Foundation, Core skills,
   Mastery, Legacy.
3. Confirm Core skills shows ladder cards (not full tier grids).
4. Confirm Pro gate shows only on Mastery badges.

### 2.8 Delete-account cascade

1. Complete an additional pause on a throwaway staging user.
2. Delete that account via the normal deletion flow.
3. Query:
   ```sql
   SELECT count(*) FROM public.pause_instances WHERE user_id = '<DELETED_UID>';
   SELECT count(*) FROM public.pause_step_events WHERE user_id = '<DELETED_UID>';
   SELECT count(*) FROM public.pause_companion_events WHERE user_id = '<DELETED_UID>';
   SELECT count(*) FROM public.pause_ai_artifacts WHERE user_id = '<DELETED_UID>';
   ```
   Expected: all zero (ON DELETE CASCADE from auth.users propagates).

## 3. Baseline reset (optional, staging only)

If staging has historical `user_badges` rows you want to confirm the
recompute against:

```sql
TRUNCATE public.user_badges;
```

Then open Profile > Badges on an account that should earn Foundation
milestones (`first-pause`, etc.) and confirm they appear and sync back.

## 4. Observability spot-checks

- Sentry: open the issues view, filter by `pause_instance_id` tag.
  Confirm no new errors after 30 minutes of traffic.
- BetterStack: filter edge logs by
  `"pause_v2"`. Expect log lines like
  `pause_v2 instance created` and zero `pause_v2 parallel write threw`.
- PostHog: `pause_instance_created`, `pause_engaged`,
  `pause_completed`, `pause_expired`, `pause_companion_counted`,
  `pause_companion_not_counted` events firing (Phase K adds these to
  the event-taxonomy doc).

## 5. Production cutover

After 24h of green staging:

1. Push latest main (already done when this doc lands).
2. Publish frontend via Lovable (required for the new StatsContentV2 +
   BadgesPanelV2 + CurrentPauseCard).
3. Flip the flag in production:
   ```sql
   UPDATE public.app_config
      SET value = jsonb_set(value, '{pause_v2_enabled}', 'true'::jsonb),
          updated_at = now()
    WHERE key = 'feature_flags';
   ```
4. Baseline reset:
   ```sql
   TRUNCATE public.user_badges RESTART IDENTITY;
   ```
5. Post in `#holzen-alerts`: "Pause V2 flipped on <time UTC>; monitor
   for 7 days; rollback = UPDATE flag = false + republish frontend".

## 6. Rollback

The cutover is reversible for **seven days** after Phase J:

```sql
UPDATE public.app_config
   SET value = jsonb_set(value, '{pause_v2_enabled}', 'false'::jsonb),
       updated_at = now()
 WHERE key = 'feature_flags';
```

Plus Lovable republish if the frontend bundle needs to fall back to
legacy components. After Phase L removes the legacy `reflections`
table, rollback is no longer possible without a DB restore; that's why
Phase L waits ≥ 14 days of green post-cutover.

## 7. What to watch in the first 24h

- `pause_instance_created` rate vs. historical `reflections INSERT`
  rate. Expect within ±10% when V1 and V2 write the same user set.
- Completion rate: `count(state='completed') / count(created)` across
  daily aggregates. A drop > 20% vs. legacy `v_reflections_engaged` is
  a red flag.
- Expiration reason distribution: `context_lost` + `window_elapsed`
  should dominate. A sudden spike in `system_cancelled` or
  `ineligible_user_state` is a bug.
- Bell: no duplicate `pause` notifications per user per regime (fix is
  in the trigger; regression here is a migration-order issue).

## 8. Related docs

- [docs/systems/pause-system.md](../systems/pause-system.md)
- [docs/systems/stats-system.md](../systems/stats-system.md)
- [docs/systems/badges-system.md](../systems/badges-system.md)
- [docs/ops/feature-flags.md](feature-flags.md)
- [docs/ops/deployment-sync-guide.md](deployment-sync-guide.md)
- ADRs:
  [skills-first-stats-ia](../decisions/2026-04-23-skills-first-stats-ia.md),
  [four-family-badge-reorg](../decisions/2026-04-23-four-family-badge-reorg.md)
