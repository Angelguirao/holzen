import { supabase } from '@/integrations/supabase/client';

/** Practice tools suggested between pauses (PracticeWidget + Tools hub). */
export type SuggestedPracticeId = 'checkin' | 'journal' | 'bodyscan' | 'replay';

export type PracticeSuggestion = {
  id: SuggestedPracticeId;
  reasonKey: string;
};

const REACTIVE_MOODS = ['anxious', 'fearful', 'fomo'] as const;

/**
 * Primary suggestion using the same exclusive branch order as the Home practice widget.
 * Optionally appends a second distinct practice (for the Tools hub) when it fits simple rules.
 */
export async function fetchPracticeSuggestions(
  userId: string,
  limit = 1,
): Promise<PracticeSuggestion[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: entries } = await supabase
    .from('practice_entries')
    .select('type, mood, created_at')
    .eq('user_id', userId)
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!entries || entries.length === 0) {
    return [{ id: 'checkin', reasonKey: 'practice.suggestFirstCheckin' }];
  }

  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }

  const lastCheckin = entries.find((e) => e.type === 'checkin');
  const daysSinceCheckin = lastCheckin
    ? Math.floor((Date.now() - new Date(lastCheckin.created_at).getTime()) / 86400000)
    : 999;

  const recentMoods = entries.filter(
    (e) => e.mood && REACTIVE_MOODS.includes(e.mood as (typeof REACTIVE_MOODS)[number]),
  );

  let primary: PracticeSuggestion;
  if (daysSinceCheckin >= 3) {
    primary = { id: 'checkin', reasonKey: 'practice.suggestCheckin' };
  } else if (recentMoods.length >= 2) {
    primary = { id: 'bodyscan', reasonKey: 'practice.suggestBodyscan' };
  } else if (!counts.journal || counts.journal < 2) {
    primary = { id: 'journal', reasonKey: 'practice.suggestJournal' };
  } else {
    primary = { id: 'replay', reasonKey: 'practice.suggestReplay' };
  }

  if (limit <= 1) {
    return [primary];
  }

  const candidates: PracticeSuggestion[] = [
    { id: 'checkin', reasonKey: 'practice.suggestCheckin' },
    { id: 'bodyscan', reasonKey: 'practice.suggestBodyscan' },
    { id: 'journal', reasonKey: 'practice.suggestJournal' },
    { id: 'replay', reasonKey: 'practice.suggestReplay' },
  ];

  const second = candidates.find((c) => {
    if (c.id === primary.id) return false;
    if (c.id === 'checkin' && daysSinceCheckin < 3) return false;
    return true;
  });
  return second ? [primary, second] : [primary];
}
