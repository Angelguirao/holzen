import { supabase } from '@/integrations/supabase/client';

export type MoodHistoryEntry = { mood: string; outcome?: string | null };

/** Recent moods for `companion-orchestrate` / intervention selector (same query in all invoke paths). */
export async function loadMoodHistoryForOrchestrate(limit = 20): Promise<MoodHistoryEntry[]> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData?.user?.id;
    if (!uid) return [];
    const { data: recentRows } = await supabase
      .from('reflections')
      .select('mood, outcome')
      .eq('user_id', uid)
      .not('mood', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!recentRows) return [];
    return recentRows
      .filter((r: { mood?: string | null }) => r.mood)
      .map((r: { mood: string; outcome?: string | null }) => ({ mood: r.mood, outcome: r.outcome ?? null }));
  } catch {
    return [];
  }
}
