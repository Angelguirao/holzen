import { supabase } from '@/integrations/supabase/client';

/**
 * Pause V2: mood + dedup hints for edge `holzen-reflect` (Reflect step in `PauseSession`).
 * Mirrors `pauseRecencyInputs` in `supabase/functions/_shared/pause-cron-parity.ts`
 * so the manual reflect-step sees the same shapes as `check-volatility`.
 */
export type ReflectMoodHistoryEntry = {
  mood: string;
  outcome: string | null;
  created_at: string | undefined;
};

export type ReflectRecencyHints = {
  moodHistory?: ReflectMoodHistoryEntry[];
  recentMessages?: string[];
  recentHaikus?: string[];
};

/**
 * Loads recency hints for the signed-in user. Returns empty fields on error or
 * unauthenticated callers (reflect step still runs without hints).
 */
export async function loadReflectRecencyHints(): Promise<ReflectRecencyHints> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return {};

    const [{ data: stepRows }, { data: artifacts }] = await Promise.all([
      supabase
        .from('pause_step_events' as never)
        .select('pause_instance_id, step_type, payload, created_at')
        .eq('user_id', userId)
        .in('step_type', ['initial_emotion_logged', 'outcome_logged'])
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('pause_ai_artifacts' as never)
        .select('kind, content, created_at')
        .eq('user_id', userId)
        .in('kind', ['opening_message', 'haiku'])
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    let moodHistory: ReflectMoodHistoryEntry[] | undefined;
    const byInstance = new Map<string, { mood?: string; outcome?: string; created_at?: string }>();
    for (const r of (stepRows ?? []) as Array<{
      pause_instance_id: string;
      step_type: string;
      payload: Record<string, unknown> | null;
      created_at: string;
    }>) {
      const e = byInstance.get(r.pause_instance_id) ?? {};
      if (r.step_type === 'initial_emotion_logged' && typeof r.payload?.mood === 'string') {
        e.mood = r.payload.mood as string;
        e.created_at = r.created_at;
      } else if (r.step_type === 'outcome_logged' && typeof r.payload?.outcome === 'string') {
        e.outcome = r.payload.outcome as string;
      }
      byInstance.set(r.pause_instance_id, e);
    }
    const entries = Array.from(byInstance.values()).filter((e) => e.mood);
    if (entries.length > 0) {
      moodHistory = entries
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
        .map((e) => ({ mood: e.mood!, outcome: e.outcome ?? null, created_at: e.created_at }));
    }

    const msgs: string[] = [];
    const haikus: string[] = [];
    for (const a of (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>) {
      if (a.kind === 'opening_message' && typeof a.content?.message === 'string') {
        msgs.push(a.content.message as string);
      } else if (a.kind === 'haiku' && typeof a.content?.haiku === 'string') {
        haikus.push(a.content.haiku as string);
      }
    }

    return {
      moodHistory,
      recentMessages: msgs.length > 0 ? msgs.slice(0, 5) : undefined,
      recentHaikus: haikus.length > 0 ? haikus.slice(0, 5) : undefined,
    };
  } catch {
    return {};
  }
}
