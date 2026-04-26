/**
 * Edge-side read model for the "past pause with user words" (Echo) feature.
 *
 * Reads `v_pause_full` for completed pauses older than `cutoffDays` and
 * joins `pause_step_events(step_type='note_updated')` and
 * `practice_entries` (`type = 'replay'`, `pause_instance_id`) into one
 * chronological `userWords` list per pause. Projects into the same
 * `PastReflectionWithWords` shape as `past-reflection-util.ts`.
 *
 * Used by Zoom Out (`generators/zoom-out.ts` — Echo rail). Returns null
 * when the user has no qualifying past pause.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  combineNoteAndReplayWords,
  parseDirectionFromContext,
  pickPastReflection,
  type PastReflectionWithWords,
  type UserWord,
} from "./past-reflection-util.ts";

export type { PastReflectionWithWords } from "./past-reflection-util.ts";

export interface FetchPastReflectionOpts {
  cutoffDays?: number;
  poolSize?: number;
  sessionContext?: string | null | undefined;
}

type PauseFullRow = {
  id: string;
  created_at: string;
  completed_at: string | null;
  engaged_at: string | null;
  initial_mood: string | null;
  outcome: string | null;
  context_snapshot: Record<string, unknown> | null;
  reflection_text: string | null;
  note_text: string | null;
};

type NoteEventRow = {
  pause_instance_id: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function contextTextOf(r: PauseFullRow): string | null {
  const c = r.context_snapshot?.context_text;
  return typeof c === "string" ? c : null;
}

export async function fetchPastReflectionWithWords(
  svcClient: SupabaseClient,
  userId: string,
  opts: FetchPastReflectionOpts = {},
  log?: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<PastReflectionWithWords | null> {
  const cutoffDays = opts.cutoffDays ?? 3;
  const poolSize = opts.poolSize ?? 30;
  const direction = parseDirectionFromContext(opts.sessionContext);
  const cutoffIso = new Date(Date.now() - cutoffDays * 86400000).toISOString();

  let pauses: PauseFullRow[] = [];
  try {
    const { data, error } = await svcClient
      .from("v_pause_full")
      .select(
        "id, created_at, completed_at, engaged_at, initial_mood, outcome, context_snapshot, reflection_text, note_text",
      )
      .eq("user_id", userId)
      .eq("state", "completed")
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: false })
      .limit(poolSize);
    if (error) throw error;
    pauses = (data ?? []) as PauseFullRow[];
  } catch (e) {
    log?.("past-reflection: v_pause_full query failed", { error: String(e) });
    return null;
  }

  if (pauses.length === 0) {
    log?.("past-reflection: no completed pauses ≥ cutoff");
    return null;
  }

  const ids = pauses.map((p) => p.id);
  let noteEvents: NoteEventRow[] = [];
  try {
    const { data, error } = await svcClient
      .from("pause_step_events")
      .select("pause_instance_id, payload, created_at")
      .eq("step_type", "note_updated")
      .in("pause_instance_id", ids);
    if (error) throw error;
    noteEvents = (data ?? []) as NoteEventRow[];
  } catch (e) {
    log?.("past-reflection: note_updated events query failed", { error: String(e) });
    noteEvents = [];
  }

  const notesByPause = new Map<string, UserWord[]>();
  for (const e of noteEvents) {
    const text = typeof e.payload?.text === "string" ? (e.payload.text as string).trim() : "";
    if (!text) continue;
    const list = notesByPause.get(e.pause_instance_id) ?? [];
    list.push({ kind: "note", body: text, created_at: e.created_at });
    notesByPause.set(e.pause_instance_id, list);
  }

  type ReplayRow = { pause_instance_id: string | null; body: string | null; created_at: string };
  let replayRows: ReplayRow[] = [];
  try {
    const { data, error } = await svcClient
      .from("practice_entries")
      .select("pause_instance_id, body, created_at")
      .eq("user_id", userId)
      .eq("type", "replay")
      .in("pause_instance_id", ids);
    if (error) throw error;
    replayRows = (data ?? []) as ReplayRow[];
  } catch (e) {
    log?.("past-reflection: practice_entries replay query failed", { error: String(e) });
    replayRows = [];
  }

  const replaysByPause = new Map<string, { body: string; created_at: string }[]>();
  for (const r of replayRows) {
    if (!r.pause_instance_id || typeof r.body !== "string") continue;
    const list = replaysByPause.get(r.pause_instance_id) ?? [];
    list.push({ body: r.body, created_at: r.created_at });
    replaysByPause.set(r.pause_instance_id, list);
  }

  const pool: PastReflectionWithWords[] = [];
  for (const p of pauses) {
    const rawNotes = notesByPause.get(p.id) ?? [];
    const noteWords = [...rawNotes].sort((a, b) =>
      a.created_at === b.created_at ? 0 : a.created_at < b.created_at ? -1 : 1,
    );
    const replayList = replaysByPause.get(p.id) ?? [];
    const merged = combineNoteAndReplayWords(noteWords, replayList);
    if (merged.length === 0) continue;
    pool.push({
      id: p.id,
      created_at: p.created_at,
      mood: p.initial_mood,
      outcome: p.outcome,
      context: contextTextOf(p),
      aiPrompt: p.reflection_text,
      userWords: merged,
    });
  }

  if (pool.length === 0) {
    log?.("past-reflection: no past pauses with user words");
    return null;
  }

  const picked = pickPastReflection(pool, direction);
  if (picked) {
    log?.("past-reflection: picked", {
      pause_instance_id: picked.id.slice(0, 8),
      user_words: picked.userWords.length,
      direction,
      pool_size: pool.length,
    });
  }
  return picked;
}
