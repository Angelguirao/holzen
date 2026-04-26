/**
 * Pure helpers for the "past pauses with user words" read model (Pause V2).
 *
 * Zoom Out's **Echo** card wants to surface "your own words from another
 * moment." This module owns the shared read-model types + selection helpers
 * used by `_shared/past-reflections.ts` (edge-side, reads `v_pause_full` +
 * `pause_step_events` + `practice_entries` replay rows).
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
 * Read model for one pause: AI reflect prompt plus chronological user-authored
 * lines (`note` / `replay`). Echo’s pool builder only adds pauses with
 * `userWords.length >= 1`; the replay screen may show `userWords` empty with
 * `aiPrompt` still present.
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

/**
 * Merge note + replay lines, oldest first. Stable tie-break: `note` before `replay`
 * at identical timestamps.
 */
export function mergeUserWordsChronological(words: readonly UserWord[]): UserWord[] {
  return [...words].sort((a, b) => {
    if (a.created_at < b.created_at) return -1;
    if (a.created_at > b.created_at) return 1;
    if (a.kind === b.kind) return 0;
    return a.kind === "note" ? -1 : 1;
  });
}

/**
 * Combine reflect-step notes with Daily Practice replay rows for one pause.
 */
export function combineNoteAndReplayWords(
  notes: readonly UserWord[],
  replayRows: readonly { body: string; created_at: string }[],
): UserWord[] {
  const replayWords: UserWord[] = [];
  for (const r of replayRows) {
    const body = typeof r.body === "string" ? r.body.trim() : "";
    if (!body) continue;
    replayWords.push({ kind: "replay", body, created_at: r.created_at });
  }
  return mergeUserWordsChronological([...notes, ...replayWords]);
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
