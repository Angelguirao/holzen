/**
 * Edge-side DB helper for the "past reflection with user words" read model.
 *
 * See `_shared/past-reflection-util.ts` for the shape and pure selection logic.
 *
 * Used by Zoom Out (`generators/zoom-out.ts` — Echo rail). The client-side
 * counterpart lives at `src/hooks/use-past-reflection.ts` (Daily Practice Replay
 * thread view). Both compose the same pure helpers over their respective data
 * stores so the read model is consistent across surfaces.
 */
import {
  assemblePastReflectionPool,
  parseDirectionFromContext,
  type PastReflectionWithWords,
  type PracticeEntryRow,
  pickPastReflection,
  type ReflectionRow,
} from "./past-reflection-util.ts";

export type { PastReflectionWithWords } from "./past-reflection-util.ts";

export interface FetchPastReflectionOpts {
  /** Minimum age (days) — defaults to 3. Callers can loosen for tests. */
  cutoffDays?: number;
  /** Pool size for the initial reflections query; defaults to 30. */
  poolSize?: number;
  /** Present-day session context; parsed for `up`/`down` preference. */
  sessionContext?: string | null | undefined;
}

/**
 * Fetch one past reflection that has at least one user-authored entry
 * (`reflections.note` or a linked `practice_entries.body`), returned as the
 * `PastReflectionWithWords` shape. Returns `null` when the user has no
 * qualifying past reflections — Zoom Out's Echo card should render its empty
 * state in that case (see ZoomOutDisplay.tsx), NOT fall back to AI text.
 *
 * Strategy (two queries, same user):
 *   1. Pull the most recent `poolSize` reflections older than `cutoffDays` days.
 *   2. Pull all `practice_entries` with `source_reflection_id` in that set.
 *   3. Assemble the pool (drop reflections with zero user words), then pick
 *      one, preferring a match on today's market direction when available.
 */
export async function fetchPastReflectionWithWords(
  svcClient: any,
  userId: string,
  opts: FetchPastReflectionOpts = {},
  log?: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<PastReflectionWithWords | null> {
  const cutoffDays = opts.cutoffDays ?? 3;
  const poolSize = opts.poolSize ?? 30;
  const direction = parseDirectionFromContext(opts.sessionContext);
  const cutoffIso = new Date(Date.now() - cutoffDays * 86400000).toISOString();

  let reflections: ReflectionRow[] = [];
  try {
    const { data, error } = await svcClient
      .from("reflections")
      .select("id, message, note, mood, outcome, context, created_at")
      .eq("user_id", userId)
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .limit(poolSize);
    if (error) throw error;
    reflections = (data ?? []) as ReflectionRow[];
  } catch (e) {
    log?.("past-reflection: reflections query failed", { error: String(e) });
    return null;
  }

  if (reflections.length === 0) {
    log?.("past-reflection: no reflections ≥ cutoff");
    return null;
  }

  const ids = reflections.map((r) => r.id);
  let entries: PracticeEntryRow[] = [];
  try {
    const { data, error } = await svcClient
      .from("practice_entries")
      .select("source_reflection_id, body, created_at")
      .in("source_reflection_id", ids)
      .eq("type", "replay");
    if (error) throw error;
    entries = (data ?? []) as PracticeEntryRow[];
  } catch (e) {
    // Non-fatal: we can still surface reflections whose `note` field has text.
    log?.("past-reflection: practice_entries query failed", { error: String(e) });
    entries = [];
  }

  const pool = assemblePastReflectionPool(reflections, entries);
  if (pool.length === 0) {
    log?.("past-reflection: no past rows with user words", {
      reflections: reflections.length,
      replay_entries: entries.length,
    });
    return null;
  }

  const picked = pickPastReflection(pool, direction);
  if (picked) {
    log?.("past-reflection: picked", {
      reflection_id: picked.id.slice(0, 8),
      user_words: picked.userWords.length,
      direction,
      pool_size: pool.length,
    });
  }
  return picked;
}
