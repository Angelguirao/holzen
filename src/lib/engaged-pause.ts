/**
 * "Engaged pause" definition.
 *
 * A pause is considered engaged (i.e. the user actually went through the flow)
 * only when ALL of the following are true:
 *   - breathing_completed = true
 *   - mood is set (mood before)
 *   - mood_after is set (the shift)
 *   - outcome is set
 *
 * Pauses that are merely generated (notification ignored) do not count toward
 * stats, badges, activity timeline, or the free-tier monthly quota.
 */

export interface EngagedPauseFields {
  breathing_completed?: boolean | null;
  mood?: string | null;
  mood_after?: string | null;
  outcome?: string | null;
}

export function isEngagedPause(r: EngagedPauseFields): boolean {
  return (
    r.breathing_completed === true &&
    r.mood != null &&
    r.mood !== '' &&
    r.mood_after != null &&
    r.mood_after !== '' &&
    r.outcome != null &&
    r.outcome !== ''
  );
}

/** Filter helper for arrays of reflection-like rows. */
export function filterEngaged<T extends EngagedPauseFields>(rows: T[]): T[] {
  return rows.filter(isEngagedPause);
}
