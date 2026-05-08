import { supabase } from '@/integrations/supabase/client';
import {
  combineNoteAndReplayWords,
  type PastReflectionWithWords,
  type UserWord,
} from '../../supabase/functions/_shared/past-reflection-util';

export const PRACTICE_REPLAY_QUERY_PREFIX = ['practice', 'replay'] as const;

export const PRACTICE_REPLAY_RECENT_PAUSES_QUERY_LEAF = 'recent-pauses' as const;

export const PRACTICE_REPLAY_RECENT_PAUSES_QUERY_PREFIX = [
  ...PRACTICE_REPLAY_QUERY_PREFIX,
  PRACTICE_REPLAY_RECENT_PAUSES_QUERY_LEAF,
] as const;

export const PRACTICE_REPLAY_THREAD_QUERY_LEAF = 'thread' as const;

export const PRACTICE_REPLAY_THREAD_QUERY_PREFIX = [
  ...PRACTICE_REPLAY_QUERY_PREFIX,
  PRACTICE_REPLAY_THREAD_QUERY_LEAF,
] as const;

/** Placeholder segment when user/instance scope is missing (queries stay disabled). */
export const PRACTICE_REPLAY_DISABLED_PLACEHOLDER = '__none__' as const;

/** TanStack cache key for `loadPauseReplayThread` (Daily Practice replay). */
export function pauseReplayThreadQueryKey(pauseInstanceId: string) {
  return [...PRACTICE_REPLAY_THREAD_QUERY_PREFIX, pauseInstanceId] as const;
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

export const REPLAY_RECENT_PAUSES_NONE_QUERY_KEY = [
  ...PRACTICE_REPLAY_RECENT_PAUSES_QUERY_PREFIX,
  PRACTICE_REPLAY_DISABLED_PLACEHOLDER,
] as const;

export function replayRecentPausesQueryKey(userId: string) {
  return [...PRACTICE_REPLAY_RECENT_PAUSES_QUERY_PREFIX, userId] as const;
}

export const PAUSE_REPLAY_THREAD_NONE_QUERY_KEY = [
  ...PRACTICE_REPLAY_THREAD_QUERY_PREFIX,
  PRACTICE_REPLAY_DISABLED_PLACEHOLDER,
] as const;

/** Resolves the replay thread or throws (for TanStack `useQuery` error state). */
export async function fetchPauseReplayThreadOrThrow(
  pauseInstanceId: string,
): Promise<PastReflectionWithWords> {
  const res = await loadPauseReplayThread(pauseInstanceId);
  if (!res.ok) {
    throw new Error(res.message ?? res.code);
  }
  return res.thread;
}

/**
 * Picker list: recent completed pauses. `listEnabled` is false once the user
 * has selected a pause (parent stops refetching the list while viewing a thread).
 */
export function getReplayRecentPausesQueryOptions(params: {
  userId: string | undefined;
  listEnabled: boolean;
}) {
  const { userId, listEnabled } = params;
  return {
    queryKey: userId ? replayRecentPausesQueryKey(userId) : REPLAY_RECENT_PAUSES_NONE_QUERY_KEY,
    queryFn: () => loadRecentCompletedPausesForReplay(),
    enabled: Boolean(userId) && listEnabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function getPauseReplayThreadQueryOptions(params: {
  userId: string | undefined;
  pauseInstanceId: string | null | undefined;
}) {
  const { userId, pauseInstanceId } = params;
  const enabled = Boolean(userId && pauseInstanceId);
  return {
    queryKey: pauseInstanceId ? pauseReplayThreadQueryKey(pauseInstanceId) : PAUSE_REPLAY_THREAD_NONE_QUERY_KEY,
    queryFn: () => fetchPauseReplayThreadOrThrow(pauseInstanceId!),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

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
