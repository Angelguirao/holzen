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

The cron-fire path is the single highest-risk surface: a bug here either
floods the user with redundant pauses or silently buries a pause the user
needed. The engine implements exactly this table.

### Cron tick (`check-volatility`)

Per eligible user, after the cron has decided the user deserves a pause
(thresholds met, not in quiet hours, not snoozed, cooldown elapsed):

1. Compute `new_fingerprint` = hash of the regime-relevant parts of the
   current context snapshot. The hash function lives in
   `supabase/functions/_shared/pause.ts#computeContextFingerprint` and
   rounds 24h + cumulative change percents into stable buckets so
   minute-to-minute fluctuations don't produce a new fingerprint.
2. Find the user's open pause: the single row (if any) with
   `state IN ('active','engaged')`.
3. Branch:
   - **No open pause + no matching-fingerprint terminal within
     `window_ms`** -> create a fresh `active` instance.
   - **Open pause, fingerprint matches** -> reject (no-op, no push). The
     existing pause still covers this regime.
   - **Open pause, fingerprint differs** -> expire the old (`context_lost`,
     `superseded_by = <new>`), then create the new `active` instance. One
     push for the new pause.
   - **No open pause, but a dismissed/expired pause within `window_ms`
     has the same fingerprint** -> reject. The user already walked away
     from this context; don't pester.

During Phase C, this logic runs **alongside** the legacy path, gated by
the `pause_v2_enabled` feature flag in `app_config.feature_flags`:

- Flag off -> only the legacy `reflections` row is created.
- Flag on  -> both the legacy row and the new `pause_instances` +
  `pause_ai_artifacts` + companion artifacts (from the orchestrator) are
  written in parallel. Push payloads include `pauseInstanceId`.

At Phase J the flag flips to true in prod; at Phase L the legacy write
(and this flag) are removed.

## 7. Manual-trigger rules

Manual triggers come from the "Need a moment" button on Home (and the
identical "Try again" button when an error state is shown). They run
through `useHolzen.manualTrigger` -> `generateMessage`, not through cron.

During Phase D (this phase), the V2 hook sits alongside the legacy
`reflections` insert with the same dual-write pattern used by the cron
(see §6):

1. Compute `new_fingerprint` from the current BTC context (24h bucket,
   cumulative bucket, severity tier). The client helper
   `src/lib/pause-fingerprint.ts` mirrors the edge helper bit-for-bit.
2. When `pause_v2_enabled` is true and the legacy insert succeeded,
   call `pause_create_or_reuse` via `src/lib/pause-api.ts`. The RPC
   implements the same rules as the cron path:
   - Open pause with matching fingerprint -> reuse. `lastPauseInstanceId`
     points at the existing row, no artifacts are rewritten.
   - Open pause with differing fingerprint -> old expires with
     `context_lost` + `superseded_by`; new instance is created.
   - No open pause but recent-dismissal with matching fingerprint -> null
     instance id; the client keeps the legacy message visible but does
     not create a V2 row (respects the user's just-now walk-away).
3. On successful create, the hook upserts `reflection_text` + optional
   `haiku` + optional `ground_nudge` into `pause_ai_artifacts`.

There is **no** manual "re-fire when an open pause already exists" path:
the "Need a moment" cooldown in the UI only gates *creation*, and the
RPC's fingerprint check handles the rest. Opening the existing pause is
the library / bell card's job (Phase F).

Every V2 write is fire-and-forget inside a `void (async () => { ... })()`
so a mirror failure never degrades the legacy surface. Failures land in
the `holzenLog.manual` stream as `pause_v2 manual: …` entries.

Cooldowns, quiet hours, and snoozes remain in the legacy hook for Phase
D — they live on the `profiles` row, not the pause instance. They move
(or don't) in Phase L cleanup.

## 8. Companion counting rule

On `pause_companion_events(action='complete')`, the server decides whether
the event advances the paired instance's completion gate. The rule is
evaluated inside `pause_log_companion` (RPC) so clients cannot lie about
whether something counted.

`counts_for_pause = true` iff **all** of the following are true:

1. `p_instance_id` is non-null.
2. The instance's state is `active` or `engaged`.
3. `now() < window_ends_at` (the window is still open).
4. `companion_type ∈ template.allowed_companion_types`.
5. No prior row exists for `(pause_instance_id, companion_type)` with
   `action='complete'` and `counts_for_pause=true` (enforced by a partial
   unique index as a second line of defence).

Otherwise the row is still inserted — completions are never silently
dropped — but `counts_for_pause = false` and `non_counting_reason` is one
of:

| Reason | When |
|---|---|
| `no_active_pause` | No instance, or instance was dismissed / completed / expired for a non-context reason. |
| `context_lost` | Instance was expired because the market regime changed. |
| `outside_window` | Instance is still live but `window_ends_at` has passed, or was expired by `window_elapsed`. |
| `not_allowed_for_template` | Companion type isn't in `allowed_companion_types`. |
| `already_counted` | Same companion type already counted for this instance. |

`entry_point` is analytics metadata only: it tells us where the user was
when they completed the companion (`pause_flow`, `library`, `bell`,
`admin_preview`). It does **not** influence counting.

### Client mirror

The pure helper `shouldCountCompanion` in `src/lib/pause-state.ts`
implements the same rule for optimistic UI. The DB stays authoritative;
the helper just lets the Pause session show a "✓ counted" chip without a
round-trip.

### Write surface (Phase B RPCs)

All four pause mutations flow through SECURITY DEFINER RPCs:

| RPC | Callers | Purpose |
|---|---|---|
| `pause_create_or_reuse(template_slug, source, context_snapshot, context_rule_result, context_fingerprint)` | Edge (cron), client hook | Fingerprint-idempotent create. Returns `{ instance_id, created, reused_reason }`. |
| `pause_log_step(instance_id, step_type, payload)` | Client (Pause flow) | Append a step event; returns the resulting state. |
| `pause_log_companion(instance_id, companion_type, action, entry_point)` | Client (Pause flow + library) | Append a companion event; returns `{ counts_for_pause, non_counting_reason, resulting_state }`. |
| `pause_dismiss_current()` | Client | Dismiss whichever open pause the caller has. No-op if none. |

Direct table writes are rejected by RLS (only `service_role` has a write
policy). This keeps the "single source of truth" invariant honest.

### Bell + Library surfaces (Phase F)

**Bell** (unified `notifications` feed):
- The `notifications_from_pause_instances` trigger fans pause lifecycle
  into the bell:
  - INSERT with `state='active'` -> upsert a `pause` notification with
    `action_path='/pause'`, `action_state={ pauseInstanceId }`.
  - UPDATE from an open state to any terminal state -> stamp
    `dismissed_at=now()` so the bell card disappears.
- The two legacy triggers (`notifications_from_reflections` and
  `notifications_from_pause_notifications`) check
  `app_config.feature_flags.pause_v2_enabled` inline and **skip** when V2
  is on — so cutover doesn't double-emit.

**Library** (`src/pages/Library.tsx`):
- `CurrentPauseCard` sits above the tab bar. Hidden entirely when the
  flag is off or the user has no open pause.
- Tapping it navigates to `/pause` with `{ pauseInstanceId }` in
  navigation state. `PauseSession` prefers that over the
  `useHolzen.lastPauseInstanceId` fallback.
- The existing library list below renders completed / dismissed /
  expired pauses via `library_items` as before; those rows now also
  carry a `pause_instance_id` FK (set by the cutover dual-write).

### Step event map (Phase E wiring)

The pause UI emits one event per user action. Each event lands in
`pause_step_events`; the transition engine re-evaluates after each
insert so state always reflects the append-only log.

| UI action | step_type | payload |
|---|---|---|
| Breathing exercise finished (PauseBreathing.onComplete) | `breath_completed` | `{}` |
| Initial mood chip tapped (PauseFeel) | `initial_emotion_logged` | `{ "mood": "calm" }` |
| Shift mood chip tapped (PauseShift) | `shift_emotion_logged` | `{ "mood": "calm" }` |
| Decide chip tapped (PauseDecide) | `outcome_logged` | `{ "outcome": "held" }` |
| Favorite toggled (PauseReflect header) | `favorite_toggled` | `{ "is_favorite": true }` |
| Companion card marked read (`useCompanionData.markCompleted`) | *(also writes `pause_companion_events` with `action='complete'`)* | — |

Notes / tags will land in Phases G–H as they're refactored off the
legacy `reflections` columns and onto the canonical event stream
(`note_updated`, `tag_updated`). The enum values already exist in the
schema and the transition engine treats them transparently.

## 9. Stats derivation

During cutover, Stats is either the legacy `StatsContent` (reads
`reflections`) or the new `StatsContentV2` (reads `v_pause_full` +
event tables via `usePauseStatsData`). `Profile.tsx` picks between them
at mount based on `pause_v2_enabled`.

The V2 substrate:

- `src/hooks/use-pause-stats-data.ts` — one loader returning
  `{ rows, stepEvents, companionEvents }` with realtime kept intact.
- `src/lib/stats/pause-score.ts` — `computePauseScore` mirrors the
  legacy 5-skill formula but eats the V2 row shape. Decision Alignment
  weight redistributes across the other four skills when no hold goal
  is configured (identical to the legacy behaviour).
- `src/lib/stats/confidence.ts` — shared `sampleConfidence` helper so
  every card labels reliability consistently.
- `src/components/stats/{SkillBar,TrendChip,ConfidenceChip}.tsx` —
  primitives.
- `src/components/stats/SkillOverviewCard.tsx` — replaces the legacy
  `HolzenScoreCard` + `SkillBalanceCard` combo with a single skills-
  first hero. When no hold goal is configured the Alignment row shows
  a "Not configured" CTA rather than a synthetic bar, per the target
  model in [stats-system.md](stats-system.md).
- `src/components/stats/StatsContentV2.tsx` — implements the four-
  section skills-first IA: Skill Overview -> Skill Deep Dives -> Journey
  & Consistency -> Advanced (collapsed). Deep dives + Journey scaffolds
  land today with placeholder copy; the cards that feed them migrate
  in subsequent commits. Advanced is collapsed by default.

See [stats-system.md](stats-system.md) for the target IA and per-card
formulas; that doc's "Recommended target model" section is the canonical
source for what each card should render.

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
