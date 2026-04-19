/**
 * Pure helpers for the "past reflections with user words" read model.
 *
 * Background: `reflections.message` stores the AI-generated prompt from
 * `holzen-reflect`, NOT user-authored text. The user's own words live in
 * `reflections.note` (free-text note on the reflect step) and in
 * `practice_entries.body` with `type="replay"` + `source_reflection_id` (user
 * responses from the Daily Practice "Replay" feature).
 *
 * Zoom Out's **Echo** card and Daily Practice's **Replay** both want to surface
 * "your own words from another moment" — these helpers define the canonical
 * read model (`PastReflectionWithWords`) and the pure selection logic so both
 * paths stay consistent.
 *
 * These helpers are PURE: no DB, no HTTP, no side effects. The edge helper
 * `_shared/past-reflections.ts` composes them with DB reads, and the client
 * hook `src/hooks/use-past-reflection.ts` does the same on the browser side.
 */

export type UserWordKind = "note" | "replay";

export interface UserWord {
  kind: UserWordKind;
  body: string;
  created_at: string;
}

/**
 * Read model returned by both the edge helper (for Zoom Out / Echo) and the
 * client hook (for Replay / Thread view). Contains only reflections that have
 * at least one user-authored entry (`note` or `replay`); callers can rely on
 * `userWords.length >= 1`.
 */
export interface PastReflectionWithWords {
  id: string;
  created_at: string;
  mood: string | null;
  outcome: string | null;
  context: string | null;
  /** `reflections.message` — the AI-generated prompt that started this pause. */
  aiPrompt: string | null;
  /** Chronological (oldest first) list of user-authored entries for this reflection. */
  userWords: UserWord[];
}

export type MarketDirection = "up" | "down" | null;

export interface ReflectionRow {
  id: string;
  created_at: string;
  message: string | null;
  note: string | null;
  mood: string | null;
  outcome: string | null;
  context: string | null;
}

export interface PracticeEntryRow {
  source_reflection_id: string | null;
  body: string | null;
  created_at: string;
}

/**
 * Given a reflection row and the set of `practice_entries` whose
 * `source_reflection_id` matches its id, produce the chronologically-ordered
 * `userWords` array.
 *
 * - Skips entries whose `body` is missing or whitespace-only.
 * - The reflection's own `note` (if non-blank) counts as a `kind: "note"`
 *   entry, dated at the reflection's `created_at`.
 * - Sort is ascending: oldest first, so the thread reads top→bottom in time
 *   order when rendered.
 */
export function buildUserWordsForReflection(
  reflection: Pick<ReflectionRow, "note" | "created_at">,
  entries: readonly Pick<PracticeEntryRow, "body" | "created_at">[],
): UserWord[] {
  const out: UserWord[] = [];
  const noteBody = (reflection.note ?? "").trim();
  if (noteBody.length > 0) {
    out.push({ kind: "note", body: noteBody, created_at: reflection.created_at });
  }
  for (const entry of entries) {
    const body = (entry.body ?? "").trim();
    if (body.length === 0) continue;
    out.push({ kind: "replay", body, created_at: entry.created_at });
  }
  out.sort((a, b) => {
    if (a.created_at === b.created_at) return 0;
    return a.created_at < b.created_at ? -1 : 1;
  });
  return out;
}

/**
 * Project a reflection row + its practice entries into the
 * `PastReflectionWithWords` read model. Returns `null` when the reflection has
 * no user-authored entries (neither a non-blank `note` nor any non-blank
 * `practice_entries.body`) — callers can skip these in strict mode.
 */
export function projectPastReflection(
  reflection: ReflectionRow,
  entries: readonly PracticeEntryRow[],
): PastReflectionWithWords | null {
  const userWords = buildUserWordsForReflection(reflection, entries);
  if (userWords.length === 0) return null;
  return {
    id: reflection.id,
    created_at: reflection.created_at,
    mood: reflection.mood,
    outcome: reflection.outcome,
    context: reflection.context,
    aiPrompt: reflection.message,
    userWords,
  };
}

/**
 * Assemble the full pool of `PastReflectionWithWords` from a batch query:
 * pair each reflection with its practice entries (matched on
 * `source_reflection_id`), project, drop rows without user words.
 *
 * Preserves the input order of `reflections` (the caller typically orders them
 * most-recent-first so selection feels fresh).
 */
export function assemblePastReflectionPool(
  reflections: readonly ReflectionRow[],
  entries: readonly PracticeEntryRow[],
): PastReflectionWithWords[] {
  const byReflection = new Map<string, PracticeEntryRow[]>();
  for (const e of entries) {
    if (!e.source_reflection_id) continue;
    const list = byReflection.get(e.source_reflection_id) ?? [];
    list.push(e);
    byReflection.set(e.source_reflection_id, list);
  }
  const out: PastReflectionWithWords[] = [];
  for (const r of reflections) {
    const projected = projectPastReflection(r, byReflection.get(r.id) ?? []);
    if (projected) out.push(projected);
  }
  return out;
}

/**
 * Parse a "direction" signal ("is up" / "is down" / neither) from a context
 * string. Kept here (and not inside the edge helper) so tests can exercise it.
 */
export function parseDirectionFromContext(ctx: string | null | undefined): MarketDirection {
  if (!ctx) return null;
  const lower = ctx.toLowerCase();
  if (lower.includes("is down")) return "down";
  if (lower.includes("is up")) return "up";
  return null;
}

/**
 * Select one past reflection from a pool, biased to match the current session's
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
