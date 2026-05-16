/**
 * Pause state machine — pure helpers.
 *
 * The canonical state engine lives in Postgres
 * (`public.pause_evaluate_transitions`). This module mirrors the same rules
 * in TypeScript so:
 *
 *   1. The Pause UI can render an optimistic state *before* the RPC round
 *      trip resolves (e.g. gating Frame/Reflect until deep `engaged` — both
 *      `initial_emotion_logged` and `breath_completed` exist; in the shipped
 *      ritual, Feel always precedes first Breathe, but Postgres checks a set, not row order).
 *   2. `src/lib/badges/compute.ts` and the Stats hooks can derive state
 *      from fixture data without round-tripping to a database.
 *   3. Unit tests pin the rules to a place humans can read (the SQL is
 *      correct by construction but reads like SQL).
 *
 * The SQL remains authoritative. If these two implementations ever drift,
 * the SQL wins and this file is wrong; fix this file to match.
 *
 * See: `supabase/migrations/20260423200730_pause_transition_engine.sql`,
 *      `docs/systems/pause-system.md` (section 3 — state machine; section 4 — RPCs / transitions).
 */

export type PauseState =
  | 'active'
  | 'engaged'
  /** New market context row waiting for user adopt (not in `v_pause_current`). */
  | 'pending'
  | 'completed'
  | 'dismissed'
  | 'expired';

export type PauseExpiredReason =
  | 'context_lost'
  | 'window_elapsed'
  | 'open_max_age'
  | 'superseded'
  | 'ineligible_user_state'
  | 'system_cancelled';

export type PauseStepType =
  | 'breath_completed'
  | 'initial_emotion_logged'
  | 'reflection_step'
  | 'shift_emotion_logged'
  | 'post_pause_emotion_logged'
  | 'ritual_depth_upgraded'
  | 'outcome_logged'
  | 'note_updated'
  | 'tag_updated'
  | 'favorite_toggled';

export type PauseCompanionAction = 'open' | 'complete';

export type PauseCompanionNonCountingReason =
  | 'no_active_pause'
  | 'outside_window'
  | 'context_lost'
  | 'not_allowed_for_template'
  | 'already_counted';

/** Shape of `pause_templates` rows used by the transition rules. */
export interface PauseTemplateRow {
  slug: string;
  /** Legacy column; server RPCs use `action_window_ms` + `dismissal_suppression_ms` for new behavior. */
  window_ms: number;
  /**
   * When non-null, `window_ends_at` is meaningful and clock expiry applies (mirrors Postgres).
   * When null, only context / dismiss / complete paths end the pause (volatility_v1 default).
   */
  action_window_ms?: number | null;
  dismissal_suppression_ms?: number;
  required_for_engaged: PauseStepType[];
  required_for_completed: PauseStepType[];
  allowed_companion_types: string[];
  required_companion_count: number;
}

/** Minimum shape of `pause_instances` rows used here. */
export interface PauseInstanceRow {
  id: string;
  user_id: string;
  state: PauseState;
  window_starts_at: string;
  window_ends_at: string;
  context_fingerprint: string;
  created_at: string;
  engaged_at: string | null;
  completed_at: string | null;
  terminal_at: string | null;
  expired_reason: PauseExpiredReason | null;
}

/** Minimum shape of `pause_step_events` rows used here. */
export interface PauseStepEventRow {
  pause_instance_id: string;
  step_type: PauseStepType;
  created_at: string;
  payload?: Record<string, unknown>;
}

/** Minimum shape of `pause_companion_events` rows used here. */
export interface PauseCompanionEventRow {
  pause_instance_id: string | null;
  companion_type: string;
  action: PauseCompanionAction;
  counts_for_pause: boolean;
  non_counting_reason: PauseCompanionNonCountingReason | null;
  created_at: string;
}

/** Distinct step types present in an event list for a given instance. */
/**
 * True when `window_ends_at` is near enough that the UI should show a clock
 * (templates with no clock-bound action use a far-future `window_ends_at`).
 */
export function pauseWindowShowsClockCountdown(windowEndsAt: string, now: Date = new Date()): boolean {
  const end = new Date(windowEndsAt).getTime();
  if (!Number.isFinite(end)) return false;
  const fiveYearsMs = 5 * 365.25 * 24 * 60 * 60 * 1000;
  return end < now.getTime() + fiveYearsMs;
}

export function collectStepTypes(
  events: readonly PauseStepEventRow[],
  instanceId: string,
): Set<PauseStepType> {
  const seen = new Set<PauseStepType>();
  for (const e of events) {
    if (e.pause_instance_id === instanceId) seen.add(e.step_type);
  }
  return seen;
}

/** True when payload marks brief ritual (mirrors `pause_evaluate_transitions` EXISTS on `brief_ritual`). */
function payloadMarksBriefRitual(payload: Record<string, unknown> | undefined): boolean {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const v = (payload as { brief_ritual?: unknown }).brief_ritual;
  if (v === true) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

/**
 * True when this instance counts as **brief** for engaged gates and `is_brief_ritual`
 * (Feel tagged `brief_ritual`, no `ritual_depth_upgraded` — mirrors `pause_instance_is_brief_ritual` in SQL).
 */
export function pauseInstanceHasBriefRitualTag(
  stepEvents: readonly PauseStepEventRow[],
  instanceId: string,
): boolean {
  let briefFeel = false;
  let upgraded = false;
  for (const e of stepEvents) {
    if (e.pause_instance_id !== instanceId) continue;
    if (e.step_type === 'ritual_depth_upgraded') upgraded = true;
    if (
      e.step_type === 'initial_emotion_logged' &&
      payloadMarksBriefRitual(e.payload as Record<string, unknown> | undefined)
    ) {
      briefFeel = true;
    }
  }
  return briefFeel && !upgraded;
}

/** Count of `complete` companion events for this instance where `counts_for_pause=true`. */
export function countedCompanionCount(
  events: readonly PauseCompanionEventRow[],
  instanceId: string,
): number {
  const seen = new Set<string>();
  for (const e of events) {
    if (e.pause_instance_id !== instanceId) continue;
    if (e.action !== 'complete') continue;
    if (!e.counts_for_pause) continue;
    seen.add(e.companion_type);
  }
  return seen.size;
}

function allIn<T>(required: readonly T[], present: Set<T>): boolean {
  for (const r of required) if (!present.has(r)) return false;
  return true;
}

/**
 * Derive the state for a given instance by replaying its events against its
 * template. Mirrors `pause_evaluate_transitions` in SQL.
 *
 * Rules (in order — first match wins):
 *   1. Instance already terminal → return as-is.
 *   2. `pending` → unchanged.
 *   3. Window elapsed (`now > window_ends_at`) → `expired` **only when**
 *      `template.action_window_ms` is set (matches Postgres).
 *   4. **`open_max_age` (engaged only):** **`engaged`** and `COALESCE(engaged_at, created_at)` + 12h ≤ `now`
 *      → `expired`. **`active`** is not time-expired by this rule (matches Postgres).
 *   5. **`volatility_v1`:** **`engaged`** uses a **set** of step types (order not evaluated):
 *      brief → `initial_emotion_logged` only; deep → `initial_emotion_logged` and
 *      `breath_completed` (Feel + first Breathe in normal UI). **`completed`** as soon as
 *      **`outcome_logged`** exists. Companion counts do **not** gate completion.
 *   6. **Other template slugs:** `required_for_engaged` / `required_for_completed` from
 *      the row, plus `countedCompanionCount` ≥ `required_companion_count` for completed.
 *   7. Otherwise: unchanged.
 */
export function computePauseState(params: {
  instance: PauseInstanceRow;
  template: PauseTemplateRow;
  stepEvents: readonly PauseStepEventRow[];
  companionEvents: readonly PauseCompanionEventRow[];
  now?: Date;
}): PauseState {
  const { instance, template, stepEvents, companionEvents } = params;
  const now = params.now ?? new Date();

  if (
    instance.state === 'completed' ||
    instance.state === 'dismissed' ||
    instance.state === 'expired'
  ) {
    return instance.state;
  }

  if (instance.state === 'pending') {
    return 'pending';
  }

  if (
    template.action_window_ms != null &&
    new Date(instance.window_ends_at).getTime() <= now.getTime()
  ) {
    return 'expired';
  }

  const openMaxAgeMs = 12 * 60 * 60 * 1000;
  if (instance.state === 'engaged') {
    const openMaxAnchor = instance.engaged_at ?? instance.created_at;
    if (new Date(openMaxAnchor).getTime() + openMaxAgeMs <= now.getTime()) {
      return 'expired';
    }
  }

  const seenSteps = collectStepTypes(stepEvents, instance.id);
  const counted = countedCompanionCount(companionEvents, instance.id);
  const briefMode = pauseInstanceHasBriefRitualTag(stepEvents, instance.id);
  const isVolatilityV1 = template.slug === 'volatility_v1';

  const engagedOk = isVolatilityV1
    ? briefMode
      ? allIn(['initial_emotion_logged'] as const, seenSteps)
      : allIn(['initial_emotion_logged', 'breath_completed'] as const, seenSteps)
    : allIn(template.required_for_engaged, seenSteps);

  const completedOk = isVolatilityV1
    ? seenSteps.has('outcome_logged')
    : allIn(template.required_for_completed, seenSteps) &&
      counted >= template.required_companion_count;

  if (completedOk) return 'completed';
  if (engagedOk && instance.state === 'active') return 'engaged';
  return instance.state;
}

/**
 * Decide whether a companion completion about to be logged should count.
 * Mirrors the server-side decision in `pause_log_companion`. Returns either
 *   { counts: true }
 * or
 *   { counts: false, reason: PauseCompanionNonCountingReason }.
 *
 * The DB version is still authoritative — this is for UI optimism.
 */
export function shouldCountCompanion(params: {
  openInstance: PauseInstanceRow | null;
  template: PauseTemplateRow | null;
  companionEvents: readonly PauseCompanionEventRow[];
  companionType: string;
  now?: Date;
}): { counts: true } | { counts: false; reason: PauseCompanionNonCountingReason } {
  const { openInstance, template, companionEvents, companionType } = params;
  const now = params.now ?? new Date();

  if (!openInstance || openInstance.state === 'completed' ||
      openInstance.state === 'dismissed') {
    return { counts: false, reason: 'no_active_pause' };
  }
  if (openInstance.state === 'pending') {
    return { counts: false, reason: 'no_active_pause' };
  }
  if (openInstance.state === 'expired') {
    return {
      counts: false,
      reason: openInstance.expired_reason === 'context_lost' ? 'context_lost' :
              openInstance.expired_reason === 'window_elapsed' ? 'outside_window' :
              openInstance.expired_reason === 'open_max_age' ? 'outside_window' :
              'no_active_pause',
    };
  }
  if (!template) {
    // Defensive: without a template we can't evaluate; treat as no_active_pause.
    return { counts: false, reason: 'no_active_pause' };
  }
  if (
    template.action_window_ms != null &&
    new Date(openInstance.window_ends_at).getTime() <= now.getTime()
  ) {
    return { counts: false, reason: 'outside_window' };
  }
  const openMaxAgeMs = 12 * 60 * 60 * 1000;
  if (openInstance.state === 'engaged') {
    const anchor = openInstance.engaged_at ?? openInstance.created_at;
    if (new Date(anchor).getTime() + openMaxAgeMs <= now.getTime()) {
      return { counts: false, reason: 'outside_window' };
    }
  }
  if (!template.allowed_companion_types.includes(companionType)) {
    return { counts: false, reason: 'not_allowed_for_template' };
  }
  const already = companionEvents.some(
    (e) =>
      e.pause_instance_id === openInstance.id &&
      e.action === 'complete' &&
      e.counts_for_pause === true &&
      e.companion_type === companionType,
  );
  if (already) return { counts: false, reason: 'already_counted' };

  return { counts: true };
}

/**
 * Cron-fire decision. Given the user's latest open pause (if any) + the new
 * fingerprint, tell the caller whether to create, reject (matching
 * fingerprint), or queue a pending offer (differing fingerprint while an
 * open pause exists). See `docs/systems/pause-system.md` §6 and `PLAN.md` §2.9.
 *
 * Does *not* mutate anything — callers invoke `pause_create_or_reuse` in the
 * DB to do the actual work. This helper is useful for edge-function logs
 * and tests so the branch logic has a TS home.
 */
export type CronFireDecision =
  | { action: 'create' }
  | { action: 'reject'; reason: 'fingerprint_match' | 'recent_dismissal' }
  /** User has touched the open pause; new regime is a `pending` row until adopt/decline. */
  | { action: 'pending_offer'; openInstanceId: string }
  /**
   * Open pause is still `active` and has no steps/companion rows (DB truth); new row is created `active` immediately.
   * Pass `openPauseTouched: false` when mirroring the server after loading event absence.
   */
  | { action: 'auto_supersede_open'; openInstanceId: string };

export function decideCronFire(params: {
  openInstance: PauseInstanceRow | null;
  recentTerminalMatch: PauseInstanceRow | null;
  newFingerprint: string;
  /**
   * When `false` and the open row is `active`, mirrors Postgres auto-supersede (new `active` instance).
   * When omitted and state is `active`, returns `pending_offer` (conservative — caller may not have loaded events yet).
   * `engaged` always implies touched → `pending_offer`.
   */
  openPauseTouched?: boolean;
}): CronFireDecision {
  const { openInstance, recentTerminalMatch, newFingerprint } = params;

  if (openInstance) {
    if (openInstance.context_fingerprint === newFingerprint) {
      return { action: 'reject', reason: 'fingerprint_match' };
    }
    const touched =
      openInstance.state === 'engaged' || params.openPauseTouched === true;
    if (!touched && params.openPauseTouched === false && openInstance.state === 'active') {
      return { action: 'auto_supersede_open', openInstanceId: openInstance.id };
    }
    return { action: 'pending_offer', openInstanceId: openInstance.id };
  }

  if (recentTerminalMatch && recentTerminalMatch.context_fingerprint === newFingerprint) {
    return { action: 'reject', reason: 'recent_dismissal' };
  }

  return { action: 'create' };
}
