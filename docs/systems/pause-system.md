# Pause System

This document explains how Holzen's pause subsystem works in V2 (the
event-sourced model that replaced the legacy `reflections` row-as-pause
pattern). It complements [stats-system.md](stats-system.md) and
[badges-system.md](badges-system.md): those describe **what** we report /
reward; this one describes **how a pause exists, advances, and ends**.

> **Status:** The V2 model ships in phased cutover. Phase A (this migration
> set) is **purely additive** — the tables and helpers in §2 exist alongside
> `reflections`, and nothing reads them yet. Phases B–L progressively wire
> the runtime onto this model and then delete the legacy path. See the
> migration plan at `/opt/cursor/artifacts/PLAN.md` (agent workspace).

## 1. What a pause is, at a glance

A **pause** is an instance of "a moment that warranted stopping and not
reacting". Every pause has:

- a **template** (e.g. `volatility_v1`) that defines what "engaged" and
  "completed" mean for this kind of pause;
- a **context snapshot** (market state the moment it fired — BTC changes,
  fear/greed, severity tier) plus a stable **fingerprint** derived from it;
- a **window** (6h for volatility) during which it is actionable;
- a **state** from the lifecycle below;
- a stream of **step events** the user produces as they engage;
- a stream of **companion events** describing which perspective tools they
  opened and completed;
- zero or more **AI artifacts** (reflection text, haiku, signal card,
  grounding nudge, historical insight, zoom-out).

A completed pause means the user actually completed the full ritual — strict
completion per §4 — not just "received a push". An expired pause means its
context is no longer valid, the window elapsed, or the system invalidated it
for another reason.

## 2. Data model

Six tables (five new + `companion_cache` which is shared). All RLS-owned by
the user, all writes gated through RPCs or service-role edge functions.

### 2.1 `pause_templates`

Per-type contract. Data, not code — so the DB transition engine and any
client helpers read the same gates.

| Column | Purpose |
|---|---|
| `slug` | Unique identifier (e.g. `volatility_v1`). |
| `version` | Bump when semantics change non-trivially. |
| `window_ms` | How long this pause stays actionable. |
| `required_for_engaged` | Step types that must be present to flip to `engaged`. |
| `required_for_completed` | Step types that must be present to flip to `completed`. |
| `allowed_companion_types` | Companion types that may count for this pause. |
| `required_companion_count` | Minimum `counts_for_pause=true` events for completion. |
| `config` | Free-form metadata grab-bag. |
| `active` | Soft-disable a template without deleting rows referencing it. |

Seed row: `volatility_v1` (see §4).

### 2.2 `pause_instances`

The state-machine row. Holds snapshot data, timestamps, final reason. The
invariant "exactly one open pause per user" is enforced by a partial unique
index: `(user_id) WHERE state IN ('active','engaged')`.

Key columns beyond the obvious ones:

| Column | Purpose |
|---|---|
| `state` | `active \| engaged \| completed \| dismissed \| expired`. |
| `source` | Who created it (`manual`, `cron_volatility`, `admin_seed`, …). |
| `context_snapshot` | jsonb of market context at creation. |
| `context_rule_result` | jsonb of which rules fired (daily vs cumulative, severity, …). |
| `context_fingerprint` | Stable hash of the regime-relevant parts of the snapshot. Used by cron dedupe (§6). |
| `window_starts_at` / `window_ends_at` | Validity window. |
| `engaged_at` / `completed_at` / `terminal_at` | Populated by the transition engine. |
| `expired_reason` | Enum in §3. Null when not expired. |
| `superseded_by` | Another pause that took over after context change. |

### 2.3 `pause_step_events`

Append-only log of user actions inside a pause. One row per step instance
(not per unique step). Step types today: `breath_completed`,
`initial_emotion_logged`, `reflection_step`, `shift_emotion_logged`,
`outcome_logged`, `note_updated`, `tag_updated`, `favorite_toggled`.

Payload conventions (subject to Phase B when the RPCs land):

| Step type | Payload shape |
|---|---|
| `breath_completed` | `{}` (presence is the signal). |
| `initial_emotion_logged` / `shift_emotion_logged` | `{ "mood": "calm" }`. |
| `outcome_logged` | `{ "outcome": "held" \| "nothing" \| "sold" \| "bought" }`. |
| `note_updated` | `{ "text": "..." }`. |
| `tag_updated` | `{ "tags": ["..."] }`. |
| `favorite_toggled` | `{ "is_favorite": true }`. |
| `reflection_step` | Opt-in breadcrumb for the reflect screen; payload free-form. |

### 2.4 `pause_companion_events`

Append-only log of companion open/complete events. Crucially records whether
the event counts toward the paired pause:

- `counts_for_pause = true` — contributes to completion.
- `counts_for_pause = false` with `non_counting_reason` — one of
  `no_active_pause`, `outside_window`, `context_lost`, `not_allowed_for_template`,
  `already_counted`.

`entry_point` is analytics-only (`pause_flow`, `library`, `bell`,
`admin_preview`).

A partial unique index prevents the same companion type from counting twice
for the same instance: `(pause_instance_id, companion_type) WHERE action='complete' AND counts_for_pause=true`.

### 2.5 `pause_ai_artifacts`

AI-generated content attached to an instance. One row per `(instance, kind)`.
Kinds today: `reflection_text`, `haiku`, `signal`, `ground_nudge`,
`historical_insight`, `zoom_out`, `zoom_out_deep_time`. Adding a new kind
requires no schema change.

### 2.6 Views

- `v_pause_current` — the single open pause per user (if any).
- `v_pause_completed` — `state='completed'` only.
- `v_pause_full` — instance + step presence booleans + counted companion
  count/types + artifact text. Row shape is 1:1 with
  `pause_instances.id`. Use this for hydration and stats.
- `v_pause_metrics_daily` — daily aggregates by user (created / engaged /
  completed / dismissed / expired split by reason).

All views are `security_invoker = true`, so RLS applies to consumers.

## 3. State machine

Five states, two open, three terminal.

```
            +-----------+    breath+initial_emotion      +-----------+
            |   active  | -----------------------------> |  engaged  |
            +-----------+                                 +-----------+
                 |   \                                      |       |
                 |    \ dismiss                             |       |
                 |     \                                    |       |
                 v      v                                   v       |
            +-----------+   all required_for_completed      |       |
            |  expired  |   + counted_companion_count       |       |
            +-----------+   >= required_companion_count     |       |
                            met                              |       |
                            +--------+---------------+-------+       |
                                     v                               |
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

Rules:

1. **`active → engaged`**: first time `required_for_engaged` step types are
   all present.
2. **`active|engaged → completed`**: `required_for_completed` step types all
   present **and** `counted_companion_count >= required_companion_count`.
3. **`active|engaged → dismissed`**: user explicitly ends (`pause_dismiss`).
4. **`active|engaged → expired`**: `pause_expire` with one of five reasons:
   - `context_lost` — fingerprint no longer matches current market regime.
   - `window_elapsed` — `now() > window_ends_at`.
   - `superseded` — another pause took over (reserved for future use; cron
     currently uses `context_lost` + `superseded_by` pointer).
   - `ineligible_user_state` — user snoozed, deleted, suspended, etc.
   - `system_cancelled` — admin override.
5. **Terminal states are final**: completed, dismissed, and expired instances
   do not transition further. Re-engaging with the same context requires a
   **new** instance.

The transition engine (`public.pause_evaluate_transitions`) is idempotent:
re-running it is a no-op if the state already reflects the events. The
AFTER-INSERT triggers on both event tables call it automatically so the
state always stays consistent with the append-only log.

Service-role-only helpers:
- `pause_sweep_window_elapsed()` — batch `active|engaged → expired` for rows
  past `window_ends_at`. Runs on pg_cron (minute cadence).
- `pause_expire(id, reason)` — explicit expiry.

User-callable (via Phase B RPC):
- `pause_dismiss(id, reason?)` — explicit end. Authorization: caller must be
  the owner or service_role.

## 4. Completion contract — `volatility_v1` walkthrough

This is the default template seeded in Phase A.

| Gate | Requirement |
|---|---|
| `required_for_engaged` | `breath_completed` + `initial_emotion_logged` |
| `required_for_completed` | `breath_completed` + `initial_emotion_logged` + `shift_emotion_logged` + `outcome_logged` |
| `required_companion_count` | `1` |
| `allowed_companion_types` | `signal`, `ground_nudge`, `historical_insight`, `zoom_out`, `zoom_out_deep_time`, `haiku` |
| `window_ms` | 6h (`21_600_000`) |

So "completed" means, at minimum: breath done, mood logged at the start,
mood logged at the end, outcome recorded, and at least one companion
completed inside the pause (not an idle browse in the library later).

This is the strict definition from the product brief: a push that the user
never really engaged with cannot become a completed pause by accident.

## 5. Context validity

Every pause carries a `context_fingerprint` — a deterministic hash of the
regime-relevant parts of its `context_snapshot`: the BTC change bucket (24h
+ cumulative), severity tier, fear/greed band, on-chain state band.

Two consequences for the cron path (full rules in §6 once Phase C wires
them):

1. **Matching fingerprint while a pause is open → reject**. The current
   pause still covers this regime; no new pause, no new push.
2. **Differing fingerprint (regime changed) → expire the old with
   `context_lost` + `superseded_by=<new>`; create the new `active`**. The
   user's old pause is no longer justified.

The window (`window_ms`) is an upper bound: once it elapses, the pause
expires with `window_elapsed` regardless of context state. For
`volatility_v1` this is 6h — long enough to survive a commute, a work
meeting, and a short break; short enough that a 24h-later "act on morning
push in the evening" never sneaks through.

## 6. Cron-fire and manual-trigger decision rules

_Documented in full alongside Phase C (edge rewire). Placeholder section so
the doc's numbering is stable across phases._

## 7. Manual-trigger rules

_Documented in full alongside Phase D (client hook rewire)._

## 8. Companion counting rule

_Documented in full alongside Phase B (RPC surface)._

## 9. Stats derivation

_See [stats-system.md](stats-system.md); Phase G refresh will cross-reference back here._

## 10. Badges derivation

_See [badges-system.md](badges-system.md); Phase H refresh will cross-reference back here._

## 11. Observability

_Documented in full alongside Phase C–D (edge + hook events emit PostHog /
Sentry tags)._

## 12. Adding a new pause type

Two steps, in order:

1. Insert a new row into `pause_templates` with its `slug`, `window_ms`,
   engaged/completed gates, allowed companions, and required companion
   count.
2. Add a code path that creates instances via `pause_create_manual` (Phase B
   RPC) or a service-role equivalent with the new `template_id`.

No schema changes are required unless you introduce a brand-new step type
(add an `ALTER TYPE pause_step_type ADD VALUE …` migration) or companion
type (open-ended text in `allowed_companion_types`, no migration needed).

## 13. Admin / runbook

Common operations (service role, via SQL Editor):

```sql
-- How many open pauses per user? (Should always be 0 or 1.)
SELECT user_id, count(*)
  FROM public.pause_instances
 WHERE state IN ('active','engaged')
 GROUP BY 1
 HAVING count(*) > 1;

-- Force-expire a pause (system_cancelled).
SELECT public.pause_expire('<uuid>', 'system_cancelled');

-- Sweep stale windows manually (cron runs this every minute).
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
- [systems/pause/ai-powered-pause-system.md](pause/ai-powered-pause-system.md)
- [ops/cron-setup.md](../ops/cron-setup.md)
- [ops/migration-security-conventions.md](../ops/migration-security-conventions.md)
