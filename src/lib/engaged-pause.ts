/**
 * Canonical definitions for what "counts" as a pause in metrics.
 *
 * ─── Default ─────────────────────────────────────────────────────────────
 * Unless you have a specific reason not to, USE `filterCompleted` /
 * `isCompletedPause`. It's the fair, consistent bar across Holzen Score,
 * skill balance, weekly trends, period comparisons, hold/calm-exit rates,
 * and the activity heatmap: did the user record a decision?
 *
 * Reach for the stricter `isFullRitualPause` only when you're measuring
 * effort/commitment to the full flow (badges, free-tier quota) — i.e.
 * anti-gaming gates, not stats.
 *
 * ─── The two levels ──────────────────────────────────────────────────────
 *   isCompletedPause  → outcome is set.
 *     A decision was actually recorded. Stats default.
 *
 *   isFullRitualPause → breathing + mood + mood_after + outcome.
 *     The user went through every step. Used as a quality/effort gate for
 *     badges and the free-tier monthly quota. (Formerly `isEngagedPause` —
 *     renamed so "engaged" isn't overloaded: at the database level we talk
 *     about whether a notification was "engaged with at all", which maps to
 *     `isCompletedPause`, not the stricter ritual check.)
 *
 * ─── Ignored notifications ───────────────────────────────────────────────
 * Cron-generated reflection rows (source != 'manual') that the user never
 * opened are "orphans": outcome is null, mood_after is null, breathing is
 * false. They satisfy NEITHER definition, so they never affect stats, scores,
 * ratios, badges, or quota. They're also swept periodically by
 * `purge_orphan_notification_reflections()` (see docs/ops/cron-setup.md).
 *
 * ⚠ Pre-filled `mood` caveat
 *   The volatility cron pre-fills `mood` on the reflection row from the
 *   user's last reported mood (see supabase/functions/check-volatility). If
 *   the user ignores that notification, the row still has a `mood` value,
 *   but no `mood_after`, `outcome`, or `breathing_completed`. This is why:
 *     - mood-shift / emotional-regulation calculations MUST require BOTH
 *       `mood` and `mood_after` — `mood` alone isn't proof of engagement.
 *     - `isCompletedPause` keys off `outcome`, the one field no cron can
 *       pre-fill truthfully.
 *
 * ─── Time bucketing ──────────────────────────────────────────────────────
 * For anything that buckets reflections by date (streak heatmap, weekly
 * trends, calendar), use `pauseTimestamp(r)` instead of `r.created_at`.
 * `created_at` is the notification insertion time for cron rows — it can
 * mis-bucket an engagement that happened hours or days after the push.
 * `engaged_at` (populated by the DB trigger) is the real moment of action;
 * `pauseTimestamp` falls back to `created_at` only for rows predating the
 * column or for manual pauses where they're the same moment anyway.
 */

export interface EngagedPauseFields {
  breathing_completed?: boolean | null;
  mood?: string | null;
  mood_after?: string | null;
  outcome?: string | null;
}

/** A decision was recorded (outcome set). Minimum bar for any metric. */
export function isCompletedPause(r: EngagedPauseFields): boolean {
  return r.outcome != null && r.outcome !== '';
}

/**
 * Full pause ritual: breathing + mood + mood_after + outcome.
 * Formerly `isEngagedPause`. Use for anti-gaming gates (badges, quota), not
 * for stats — it throws out perfectly valid completed pauses that skipped
 * the breathing step, which would under-count users who bypass it.
 */
export function isFullRitualPause(r: EngagedPauseFields): boolean {
  return (
    r.breathing_completed === true &&
    r.mood != null &&
    r.mood !== '' &&
    r.mood_after != null &&
    r.mood_after !== '' &&
    isCompletedPause(r)
  );
}

/** Filter helper for arrays of reflection-like rows (has a recorded decision). */
export function filterCompleted<T extends EngagedPauseFields>(rows: T[]): T[] {
  return rows.filter(isCompletedPause);
}

/** Filter helper for full-ritual rows (use for badges / quota, not stats). */
export function filterFullRitual<T extends EngagedPauseFields>(rows: T[]): T[] {
  return rows.filter(isFullRitualPause);
}

/** Fields needed by `pauseTimestamp`. */
export interface PauseTimestampFields {
  engaged_at?: string | null;
  created_at: string;
}

/**
 * The timestamp to use when bucketing a reflection into a day/week/month.
 *
 * Prefers `engaged_at` (set by the DB trigger the first time outcome became
 * non-empty — see migration 20260420230000). Falls back to `created_at` for:
 *   - rows that pre-date the column,
 *   - orphan rows (engaged_at stays NULL — but orphans should already be
 *     filtered out by `filterCompleted` before bucketing anyway, so this is
 *     just a defensive fallback).
 *
 * Callers pass the raw row; the result is a Date so you can drop it straight
 * into date-fns helpers.
 */
export function pauseTimestamp(r: PauseTimestampFields): Date {
  return new Date(r.engaged_at ?? r.created_at);
}
