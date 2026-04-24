/**
 * Pure helpers for the "past pauses with user words" read model (Pause V2).
 *
 * Zoom Out's **Echo** card wants to surface "your own words from another
 * moment." This module owns the shared read-model types + selection helpers
 * used by `_shared/past-reflections.ts` (edge-side, reads `v_pause_full` +
 * `pause_step_events`).
 *
 * PURE: no DB, no HTTP, no side effects.
 */

export type UserWordKind = "note" | "replay";

export interface UserWord {
  kind: UserWordKind;
  body: string;
  created_at: string;
}

/**
 * Read model returned by the edge helper for Zoom Out / Echo. Contains only
 * pauses that have at least one user-authored entry (`note` or `replay`);
 * callers can rely on `userWords.length >= 1`.
 */
export interface PastReflectionWithWords {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  context: string | null;
  /** AI-generated reflection prompt (`v_pause_full.reflection_text`). */
  aiPrompt: string | null;
  /** Chronological (oldest first) list of user-authored entries for this pause. */
  userWords: UserWord[];
}

export type MarketDirection = "up" | "down" | null;

/**
 * Parse a "direction" signal ("is up" / "is down" / neither) from a context
 * string. Kept here (not inside the edge helper) so tests can exercise it.
 */
export function parseDirectionFromContext(ctx: string | null | undefined): MarketDirection {
  if (!ctx) return null;
  const lower = ctx.toLowerCase();
  if (lower.includes("is down")) return "down";
  if (lower.includes("is up")) return "up";
  return null;
}

/**
 * Select one past pause from a pool, biased to match the current session's
 * market direction when one is provided. Falls back to the full pool when the
 * direction-filtered subset is empty, so we never return `null` just because
 * today's direction happens to have no matching past pauses.
 *
 * Selection within the preferred subset is random among the **10 most recent**
 * entries (caller-provided order is preserved), giving a little variation
 * without reaching deep into stale history.
 */
export function pickPastReflection(
  pool: readonly PastReflectionWithWords[],
  direction: MarketDirection,
  rng: () => number = Math.random,
): PastReflectionWithWords | null {
  if (pool.length === 0) return null;
  let preferred = pool;
  if (direction) {
    const matched = pool.filter((p) => parseDirectionFromContext(p.context) === direction);
    if (matched.length > 0) preferred = matched;
  }
  const sampleSize = Math.min(preferred.length, 10);
  const idx = Math.floor(rng() * sampleSize);
  return preferred[idx] ?? null;
}
