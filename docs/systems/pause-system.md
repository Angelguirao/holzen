# Pause System

The pause subsystem is Holzen's core behavioural primitive: a single
explicit lifecycle that captures the moment a user was prompted (or
prompted themselves) to stop and reconsider a decision. Every stats
and badges surface reads from this model. There is no separate legacy
pause path.

## 1. What a pause is

A **pause** is a row in `public.pause_instances`. Every pause has:

- a **template** (e.g. `volatility_v1`) defining what "engaged" and
  "completed" mean for this kind of pause;
- a **context snapshot** (market state when it fired — BTC changes,
  fear/greed band, severity tier) plus a stable **fingerprint**
  derived from it;
- a **window** (6h for volatility) during which it is actionable;
- a **state** from the lifecycle below;
- an append-only stream of **step events** the user produces as they
  engage (breath, mood, outcome, note, tag, favorite);
- an append-only stream of **companion events** (open / complete; each
  flagged with whether it counted toward this pause's completion);
- zero or more **AI artifacts** (reflection text, haiku, signal,
  grounding nudge, historical insight, zoom-out).

A **completed** pause is one where the user actually completed the
full ritual — strict completion per §4 — not just "received a push"
or "tapped the decision chip".

## 2. Data model

### 2.1 `pause_templates`

Per-type contract stored as data, so the DB transition engine and any
client helpers read the same gates.

| Column | Purpose |
|---|---|
| `slug` | Unique identifier (e.g. `volatility_v1`). |
| `version` | Bump when semantics change non-trivially. |
| `window_ms` | How long this pause stays actionable. |
| `required_for_engaged` | Step types required to flip to `engaged`. |
| `required_for_completed` | Step types required to flip to `completed`. |
| `allowed_companion_types` | Companion types that may count for this pause. |
| `required_companion_count` | Min `counts_for_pause=true` events for completion. |
| `config` | Free-form metadata grab-bag. |
| `active` | Soft-disable without deleting rows referencing it. |

Seed row: `volatility_v1` (see §4).

### 2.2 `pause_instances`

The state-machine row. Holds snapshot, timestamps, terminal reason.
The invariant "exactly one **current** pause per user" (`active` or
`engaged`) is enforced by a partial unique index:
`(user_id) WHERE state IN ('active','engaged')`. A user may also have
at most one `pending` offer (separate partial unique index).

Key columns:

| Column | Purpose |
|---|---|
| `state` | `active \| engaged \| pending \| completed \| dismissed \| expired`. |
| `source` | `manual`, `cron_volatility`, `admin_seed`, … |
| `context_snapshot` | jsonb — market context at creation. |
| `context_rule_result` | jsonb — which rules fired (daily/cumulative). |
| `context_fingerprint` | Stable hash of regime-relevant snapshot fields. |
| `window_starts_at` / `window_ends_at` | Validity window. |
| `engaged_at` / `completed_at` / `terminal_at` | Populated by the transition engine. |
| `expired_reason` | Enum (§3). Null when not expired. |
| `superseded_by` | Pointer to the pause that took over after a context change. |

### 2.3 `pause_step_events`

Append-only log of user actions. One row per step instance. Types:
`breath_completed`, `initial_emotion_logged`, `reflection_step`,
`shift_emotion_logged`, `outcome_logged`, `note_updated`,
`tag_updated`, `favorite_toggled`.

Payload shapes:

| Step type | Payload |
|---|---|
| `breath_completed` | `{}` |
| `initial_emotion_logged` | `{ "mood": "calm", "intensity"?: 1–5 }` (intensity optional; Feel step). |
| `shift_emotion_logged` | `{ "mood": "calm", "shift_intensity"?: 1–5 }` (shift scale optional; Shift step). |
| `outcome_logged` | `{ "outcome": "held" \| "nothing" \| "sold" \| "bought" }` |
| `note_updated` | `{ "text": "..." }` |
| `tag_updated` | `{ "tags": ["..."] }` |
| `favorite_toggled` | `{ "is_favorite": true }` |
| `reflection_step` | Free-form breadcrumb for the Reflect screen. |

### 2.4 `pause_companion_events`

Append-only log of companion open/complete events. Crucially records
whether the event counts toward completion:

- `counts_for_pause = true` — contributes to completion.
- `counts_for_pause = false` with `non_counting_reason` — one of
  `no_active_pause`, `outside_window`, `context_lost`,
  `not_allowed_for_template`, `already_counted`.

`entry_point` is analytics-only (`pause_flow`, `library`, `bell`,
`admin_preview`).

A partial unique index prevents the same companion type from counting
twice for the same instance:
`(pause_instance_id, companion_type) WHERE action='complete' AND counts_for_pause=true`.

### 2.5 `pause_ai_artifacts`

AI-generated content attached to an instance. One row per
`(instance, kind)`. Kinds: `reflection_text`, `haiku`, `signal`,
`ground_nudge`, `historical_insight`, `zoom_out`,
`zoom_out_deep_time`. Adding a new kind requires no schema change.

### 2.6 Views

- `v_pause_current` — the single open pause per user (if any).
- `v_pause_completed` — `state='completed'` only.
- `v_pause_full` — instance + step presence booleans + counted
  companion count/types + artifact text + latest `initial_mood` /
  `shift_mood` and optional 1–5 scales `initial_emotion_intensity` /
  `shift_emotion_intensity` from step payloads. Row shape is 1:1 with
  `pause_instances.id`. Use this for hydration and stats.
- `v_pause_metrics_daily` — daily aggregates by user (created /
  engaged / completed / dismissed / expired split by reason).

All views are `security_invoker = true`.

## 3. State machine

Six states: three non-terminal (`active`, `engaged`, `pending`) and
three terminal (`completed`, `dismissed`, `expired`). `v_pause_current`
only surfaces `active|engaged` — `pending` is a **context offer** row
waiting for adopt/decline (or TTL / replacement).

```
            +-----------+    breath+initial_emotion      +-----------+
            |   active  | -----------------------------> |  engaged  |
            +-----------+                                 +-----------+
                 |   \                                      |       |
                 |    \ dismiss                             |       |
                 v     v                                   v       |
            +-----------+   all required_for_completed     |       |
            |  expired  |   + counted_companion_count      |       |
            +-----------+   >= required_companion_count    |       |
                            met                             |       |
                                      v                              |
                               +-----------+                         |
                               | completed |                         |
                               +-----------+                         |
                                                                      |
                                                                      | dismiss
                                                                      v
                                                                +-----------+
                                                                | dismissed |
                                                                +-----------+
```

**`pending` (context offer)** — not shown as the “current” pause on Home
until the user adopts it (`pause_adopt_pending_offer`) or declines
(`pause_decline_pending_offer`). At most **one** `pending` row per user
(partial unique index). When the market fingerprint changes again
before adopt, the older `pending` row is expired (`system_cancelled`)
and replaced by a new `pending` (or by a new `active` if the auto rule
below applies) — pendings **do not accumulate**.

Transitions:

1. **`active → engaged`**: first time `required_for_engaged` step
   types are all present.
2. **`active|engaged → completed`**: `required_for_completed` step
   types all present AND `counted_companion_count >= required_companion_count`.
3. **`active|engaged → dismissed`**: user explicitly ends
   (`pause_dismiss` RPC).
4. **`active|engaged → expired`**: `pause_expire` RPC, batch sweep, or
   transition engine, with one of:
   - `context_lost` — fingerprint no longer matches current regime (legacy paths).
   - `window_elapsed` — `now() > window_ends_at` (template action window).
   - `open_max_age` — `active|engaged` row is older than **12 hours**
     wall-clock from `created_at` (cap so an open pause cannot last
     indefinitely when the template window is unbounded).
   - `superseded` — replaced by a newer instance (user adopt or
     auto-supersede of an untouched open pause).
   - `ineligible_user_state` — snoozed / deleted / suspended.
   - `system_cancelled` — admin override, declined `pending`, cleared
     stale `pending`, etc.
5. **`pending`**: no step logging until adopt; no transition-engine
   progression; expires after **12 hours** from `created_at` via
   `pause_sweep_window_elapsed` (`system_cancelled`, notification
   dismissed). Newer fingerprint from `pause_create_or_reuse*` replaces
   an existing `pending` immediately.
6. **Terminal states are final**: completed / dismissed / expired
   pauses do not transition further. Re-engaging the same context
   requires a **new** instance.

The transition engine (`public.pause_evaluate_transitions`) is
idempotent. `AFTER INSERT` triggers on both event tables call it
automatically so state always reflects the append-only log.

Service-role helpers:

- `pause_sweep_window_elapsed()` — batch expiry: (1) `active|engaged`
  past `window_ends_at` → `window_elapsed`; (2) `active|engaged` with
  `created_at <= now() - 12h` → `open_max_age`; (3) `pending` with
  `created_at <= now() - 12h` → `system_cancelled` (`metadata.pending_stale_ttl`).
  Intended pg_cron cadence: **at least hourly** (minute-level is fine).
- `pause_expire(id, reason)` — explicit expiry.

User-callable (RPCs):

- `pause_create_or_reuse(template_slug, source, context_snapshot,
  context_rule_result, context_fingerprint)` — fingerprint-
  idempotent create. Returns JSON including `instance_id`, `created`,
  `reused_reason`, `pending_offer`, `prior_open_instance_id` (see §5–§6).
- `pause_create_or_reuse_as(user_id, …)` — service-role variant.
  Used by edge crons that run without a user JWT.
- `pause_log_step(instance_id, step_type, payload)` — append a step
  event; returns the resulting state.
- `pause_log_companion(instance_id, companion_type, action,
  entry_point)` — append a companion event; server decides
  `counts_for_pause`; returns `{ counts_for_pause,
  non_counting_reason, resulting_state }`.
- `pause_dismiss_current()` — user-driven dismiss of whichever open
  pause the caller has.

All direct table writes are rejected by RLS; the RPCs are the only
authenticated write surface.

## 4. Completion contract — `volatility_v1`

| Gate | Requirement |
|---|---|
| `required_for_engaged` | `breath_completed` + `initial_emotion_logged` |
| `required_for_completed` | above + `shift_emotion_logged` + `outcome_logged` |
| `required_companion_count` | `1` |
| `allowed_companion_types` | `signal`, `ground_nudge`, `historical_insight`, `zoom_out`, `zoom_out_deep_time`, `haiku` |
| `window_ms` | 6h (`21_600_000`) |

Completion means: breath done, mood at the start, mood at the end,
outcome recorded, at least one companion completed **inside the
pause** (not an idle browse later in the library).

## 5. Context validity and pending offers

Every pause carries a `context_fingerprint` — a deterministic SHA-256
of the regime-relevant parts of its `context_snapshot`: the BTC
change bucket (24h + cumulative), severity tier, fear/greed band,
on-chain state band. Helpers:

- `supabase/functions/_shared/pause.ts#computeContextFingerprint`
  (edge).
- `src/lib/pause-fingerprint.ts#computeContextFingerprint` (browser —
  bit-for-bit equivalent).

**While `active|engaged` is open and the new fingerprint differs:**

1. **Matching fingerprint → reject** (`reused_reason=fingerprint_match`).
   No new row; no push.

2. **User has not touched the open pause** — no rows in
   `pause_step_events` or `pause_companion_events` for that instance,
   and state is still `active` (not `engaged`) — then the open row is
   expired (`superseded`, `metadata.auto_superseded_untouched_open`) and
   the new snapshot is inserted as **`active`** immediately
   (`pending_offer=false`). Home and cron behave like a normal new pause;
   no adopt modal.

3. **Otherwise** (user has logged at least one step or companion event,
   or is already `engaged`) — insert **`pending`** (`pending_offer=true`).
   The existing open pause stays on `v_pause_current` until the user
   adopts (`pause_adopt_pending_offer`) or declines
   (`pause_decline_pending_offer`). Edge/cron must **not** overwrite Home
   preview with the pending instance until adopt (see `check-volatility`).

**Stale pendings:** only one pending per user. A newer differing
fingerprint expires the previous pending (`system_cancelled`,
`pending_offer_replaced`) before inserting the new pending. Pendings
also expire after **12h** from `created_at` via the sweep (see §3).

The template `window_ends_at` / `window_elapsed` is separate from the
12h **open_max_age** cap (the latter applies even when the action window
is unbounded).

## 6. Cron-fire rules (`check-volatility`)

Per eligible user per tick:

1. Compute `new_fingerprint` from current context.
2. Call `pause_create_or_reuse_as(user_id, slug, source, snapshot,
   rule_result, fingerprint)`. The RPC serializes concurrent ticks for
   the same user with `pg_advisory_xact_lock(hashtextextended(user_id::text, 0))`,
   closing the read-then-insert race.
3. Branch on the RPC return:
   - `created=true`, `pending_offer=false` — new **`active`** instance
     (either no open pause, or auto-supersede of an untouched open pause).
     Write reflection_text + haiku artifacts; dispatch push + email;
     fire-and-forget the orchestrator to generate the rest of the companions.
   - `created=true`, `pending_offer=true` — new **`pending`** instance;
     keep writing AI artifacts to `instance_id`, but **do not** swap Home /
     `profiles.last_message` to that id until adopt (current open pause
     remains the ritual surface).
   - `created=false, reused_reason='fingerprint_match'` — reuse open
     instance. No push.
   - `instance_id=null, reused_reason='recent_dismissal'` — user
     walked away from this exact regime recently. Skip entirely.

The `notifications_from_pause_instances` trigger fans each new
`active` instance into the unified `notifications` feed (bell) with
`action_path='/pause'` and `action_state={ pauseInstanceId }`. When
the instance transitions to any terminal state, the trigger stamps
`dismissed_at=now()` so the bell clears the card.

## 7. Manual-trigger rules (`useHolzen`)

"Need a moment" / "Try again" buttons on Home call
`pause_create_or_reuse` with `source='manual'`. The client computes
the fingerprint with `src/lib/pause-fingerprint.ts` (mirrors the edge
helper). The RPC applies the same rules as the cron path:

- Open pause with matching fingerprint → reuse. `lastPauseInstanceId`
  points at the existing row, no artifact is rewritten.
- Open pause with differing fingerprint → same branching as cron: **pending
  offer** if the user has touched the open pause; otherwise **auto
  supersede** to a new `active` row (see §5).
- No open pause + recent-dismissal with matching fingerprint → null
  instance id; UI shows the reflection text but does not create a V2
  row (respects the user's just-now walk-away).

On successful create, the hook upserts `reflection_text` + optional
`haiku` + optional `ground_nudge` into `pause_ai_artifacts` and
mirrors the bookmark into `library_items` with the
`pause_instance_id` FK.

Cooldowns and quiet hours are enforced by the client-side manual
cooldown helper; the RPC itself doesn't know about them.

## 8. Companion counting rule

On `pause_companion_events(action='complete')`, the server decides
whether the event advances the paired instance's completion gate.
`counts_for_pause = true` iff **all** of the following:

1. `p_instance_id` is non-null.
2. Instance state is `active` or `engaged`.
3. `now() < window_ends_at`.
4. `companion_type ∈ template.allowed_companion_types`.
5. No prior row exists for `(pause_instance_id, companion_type)` with
   `action='complete'` and `counts_for_pause=true` (enforced by a
   partial unique index as backstop).

Otherwise the row is still inserted — completions are never silently
dropped — but `counts_for_pause = false` and `non_counting_reason`
is one of:

| Reason | When |
|---|---|
| `no_active_pause` | No instance, or instance is dismissed / completed / expired for a non-context reason. |
| `context_lost` | Instance was expired because the market regime changed. |
| `outside_window` | Instance is live but `window_ends_at` has passed, or was expired by `window_elapsed` / `open_max_age`. |
| `not_allowed_for_template` | Companion type isn't in `allowed_companion_types`. |
| `already_counted` | Same companion type already counted for this instance. |

The client mirror `shouldCountCompanion` in `src/lib/pause-state.ts`
implements the same rule for optimistic UI. The DB stays
authoritative.

## 9. Stats derivation

The Stats tab is skills-first (Skill Overview → Skill Deep Dives
→ Journey & Consistency → Advanced) per
[stats-system.md](stats-system.md). Every metric is computed from
`v_pause_full` + `pause_step_events` + `pause_companion_events`:

- `src/lib/stats/pause-score.ts` — 5-skill composite score.
- `src/lib/stats/confidence.ts` — sample-size confidence chips.
- `src/components/stats/StatsContentV2.tsx` — the 4-section shell.
- Per-skill cards in `src/components/stats/<skill>/` cover
  Regulation (MoodShiftChart, MoodTrendChart,
  ReactiveToComposedConversionCard), Tolerance
  (VolatilityToleranceCardV2, OutcomeStabilityCard), Alignment
  (AlignmentCard), Reappraisal (PerspectiveToolsImpactCard),
  Awareness (AwarenessDepthCard).
- Journey cards in `src/components/stats/journey/`: StreakTimeline,
  MilestoneTimeline, PeriodComparisonCard.
- Advanced cards in `src/components/stats/advanced/`: MoodPriceChart,
  MoodPriceScatter.

## 10. Badges derivation

BadgesPanelV2 implements the 4-family / 14-active model from
[badges-system.md](badges-system.md):

- `src/lib/badges/definitions.ts` — declarative config.
- `src/lib/badges/compute.ts` — pure `computeBadges(...)`.
- `src/hooks/use-badges.ts` — memoized loader producing
  `BadgeSnapshot`.
- `src/components/BadgesPanelV2.tsx` — 4-family layout with
  ladder-collapsing.
- `src/hooks/use-badge-sync.ts` — unchanged mechanism with a silent-
  seed escape: on the very first render after a `user_badges`
  truncate, all newly-earned rows are inserted silently (no
  celebration, no push) to avoid a flood.

## 11. Observability

Three surfaces share one pivot: `pause_instance_id`.

- **Sentry**: edge + hook error handlers attach `pause_instance_id`
  as a tag.
- **BetterStack**: edge log lines around pause creation carry
  `pause_instance_id` + a `pause_v2` sub-tag.
- **PostHog**: product events with `pause_instance_id` as a super-
  property — `pause_instance_created`, `pause_engaged`,
  `pause_completed`, `pause_expired`, `pause_companion_counted`,
  `pause_companion_not_counted`.

See [ops/event-taxonomy.md](../ops/event-taxonomy.md) for the
canonical event list.

## 12. Adding a new pause type

1. `INSERT INTO pause_templates (...)` with a new slug, windows,
   gates, allowed companions, and required companion count.
2. Add a creation path: either
   - (Client) call `pause_create_or_reuse` with the new
     `template_slug`.
   - (Edge / cron) call `pause_create_or_reuse_as` from a service-
     role client.

No schema changes are required unless you introduce a brand-new step
type (`ALTER TYPE public.pause_step_type ADD VALUE …`) or a new
companion type (`allowed_companion_types` is unconstrained text[]).

Document the new type in this file (§4 walkthrough pattern) and add
an entry to the event-taxonomy doc.

## 13. Admin / runbook

```sql
-- How many open pauses per user? Should always be 0 or 1.
SELECT user_id, count(*)
  FROM public.pause_instances
 WHERE state IN ('active','engaged')
 GROUP BY 1
 HAVING count(*) > 1;

-- Force-expire a pause (system_cancelled).
SELECT public.pause_expire('<uuid>', 'system_cancelled');

-- Sweep: template window elapsed, 12h open_max_age, 12h stale pending.
SELECT public.pause_sweep_window_elapsed();

-- Per-day lifecycle aggregate for a user.
SELECT * FROM public.v_pause_metrics_daily
 WHERE user_id = '<uuid>'
 ORDER BY day DESC
 LIMIT 30;
```

## See also

- [stats-system.md](stats-system.md)
- [badges-system.md](badges-system.md)
- [ops/event-taxonomy.md](../ops/event-taxonomy.md)
- [ops/migration-security-conventions.md](../ops/migration-security-conventions.md)
