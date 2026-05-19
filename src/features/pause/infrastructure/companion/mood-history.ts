import { supabase } from '@/integrations/supabase/client';

export type MoodHistoryEntry = { mood: string; outcome?: string | null };

/**
 * Recent moods for `companion-orchestrate` / intervention selector.
 *
 * Reads `pause_step_events` and pairs initial_emotion_logged entries
 * with any outcome_logged on the same instance. Returns most-recent
 * mood-first, shaped for the existing orchestrator payload.
 */
export async function loadMoodHistoryForOrchestrate(limit = 20): Promise<MoodHistoryEntry[]> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return [];

    const { data: rows } = await supabase
      .from('pause_step_events' as never)
      .select('pause_instance_id, step_type, payload, created_at')
      .eq('user_id', uid)
      .in('step_type', ['initial_emotion_logged', 'outcome_logged'])
      .order('created_at', { ascending: false })
      .limit(limit * 3);

    const stepRows = (rows ?? []) as Array<{
      pause_instance_id: string;
      step_type: string;
      payload: Record<string, unknown> | null;
      created_at: string;
    }>;

    const byInstance = new Map<string, { mood?: string; outcome?: string; ts: string }>();
    for (const r of stepRows) {
      const e = byInstance.get(r.pause_instance_id) ?? { ts: r.created_at };
      if (r.step_type === 'initial_emotion_logged' && typeof r.payload?.mood === 'string') {
        e.mood = r.payload.mood as string;
        e.ts = r.created_at;
      } else if (r.step_type === 'outcome_logged' && typeof r.payload?.outcome === 'string') {
        e.outcome = r.payload.outcome as string;
      }
      byInstance.set(r.pause_instance_id, e);
    }

    return Array.from(byInstance.values())
      .filter((e) => e.mood)
      .sort((a, b) => b.ts.localeCompare(a.ts))
      .slice(0, limit)
      .map((e) => ({ mood: e.mood!, outcome: e.outcome ?? null }));
  } catch {
    return [];
  }
}
