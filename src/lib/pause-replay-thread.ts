import { supabase } from '@/integrations/supabase/client';
import {
  combineNoteAndReplayWords,
  type PastReflectionWithWords,
  type UserWord,
} from '../../supabase/functions/_shared/past-reflection-util';

/** TanStack cache key for `loadPauseReplayThread` (Daily Practice replay). */
export function pauseReplayThreadQueryKey(pauseInstanceId: string) {
  return ['practice', 'replay', 'thread', pauseInstanceId] as const;
}

function contextTextFromSnapshot(snapshot: Record<string, unknown> | null | undefined): string | null {
  const c = snapshot?.context_text;
  return typeof c === 'string' ? c : null;
}

/**
 * Load one completed pause as the Pause V2 replay read model (notes + replay lines + AI prompt).
 * RLS must allow the caller to read `v_pause_full`, `pause_step_events`, and `practice_entries`.
 */
export async function loadPauseReplayThread(pauseInstanceId: string): Promise<
  | { ok: true; thread: PastReflectionWithWords }
  | { ok: false; code: 'not_found' | 'not_completed' | 'load_error'; message?: string }
> {
  const { data: row, error } = await supabase
    .from('v_pause_full')
    .select('id, created_at, initial_mood, outcome, context_snapshot, reflection_text, state')
    .eq('id', pauseInstanceId)
    .maybeSingle();

  if (error) {
    return { ok: false, code: 'load_error', message: error.message };
  }
  if (!row) {
    return { ok: false, code: 'not_found' };
  }
  if (row.state !== 'completed') {
    return { ok: false, code: 'not_completed' };
  }

  const { data: events, error: evErr } = await supabase
    .from('pause_step_events')
    .select('payload, created_at')
    .eq('pause_instance_id', pauseInstanceId)
    .eq('step_type', 'note_updated')
    .order('created_at', { ascending: true });

  if (evErr) {
    return { ok: false, code: 'load_error', message: evErr.message };
  }

  const notes: UserWord[] = [];
  for (const e of events ?? []) {
    const payload = e.payload as Record<string, unknown> | null;
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    if (!text) continue;
    notes.push({ kind: 'note', body: text, created_at: e.created_at });
  }

  const replayQuery = await (supabase
    .from('practice_entries')
    .select('body, created_at')
    .eq('pause_instance_id' as never, pauseInstanceId as never)
    .eq('type', 'replay')
    .order('created_at', { ascending: true }) as unknown as Promise<{
      data: Array<{ body: string | null; created_at: string }> | null;
      error: { message: string } | null;
    }>);
  const { data: replays, error: rErr } = replayQuery;

  if (rErr) {
    return { ok: false, code: 'load_error', message: rErr.message };
  }

  const replayRows = (replays ?? [])
    .map((r) => ({
      body: typeof r.body === 'string' ? r.body : '',
      created_at: r.created_at,
    }))
    .filter((r) => r.created_at);

  const userWords = combineNoteAndReplayWords(notes, replayRows);

  const thread: PastReflectionWithWords = {
    id: row.id,
    created_at: row.created_at,
    mood: row.initial_mood,
    outcome: row.outcome,
    context: contextTextFromSnapshot(row.context_snapshot as Record<string, unknown> | null),
    aiPrompt: row.reflection_text,
    userWords,
  };

  return { ok: true, thread };
}

export type PausePickerRow = {
  id: string;
  created_at: string;
  reflection_text: string | null;
};

/** Recent completed pauses for the replay picker (shell only — no per-row word counts). */
export async function loadRecentCompletedPausesForReplay(limit = 24): Promise<PausePickerRow[]> {
  const { data, error } = await supabase
    .from('v_pause_full')
    .select('id, created_at, reflection_text')
    .eq('state', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as PausePickerRow[];
}
