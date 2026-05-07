import { supabase } from '@/integrations/supabase/client';
import type { CalendarActivity } from '@/components/HistoryCalendar';

const PRACTICE_LABELS: Record<string, string> = {
  checkin: 'Emotional check-in',
  journal: 'Guided journal',
  bodyscan: 'Body scan',
  replay: 'Pause replay',
};

/** Parallel read for Profile → Journey → Activity (`HistoryContent`). */
export async function fetchHistoryCalendarActivities(userId: string): Promise<CalendarActivity[]> {
  const [rP, rL, rB, rPr] = await Promise.all([
    supabase
      .from('v_pause_full' as never)
      .select('id, created_at, completed_at, engaged_at, initial_mood, shift_mood, outcome, state, has_breath_completed')
      .eq('user_id', userId)
      .eq('state', 'completed'),
    supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', userId),
    supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', userId),
    supabase.from('practice_entries').select('id, created_at, type, mood, prompt').eq('user_id', userId),
  ]);
  if (rP.error || rL.error || rB.error || rPr.error) {
    throw new Error(
      rP.error?.message ?? rL.error?.message ?? rB.error?.message ?? rPr.error?.message ?? 'load failed',
    );
  }
  const pauses = rP.data;
  const lets = rL.data;
  const bads = rB.data;
  const pracs = rPr.data;

  const items: CalendarActivity[] = [];
  ((pauses ?? []) as Array<{
    id: string;
    created_at: string;
    completed_at: string | null;
    engaged_at: string | null;
    initial_mood: string | null;
  }>).forEach((p) => {
    items.push({
      date: p.completed_at ?? p.engaged_at ?? p.created_at,
      type: 'pause',
      mood: p.initial_mood ?? undefined,
      id: p.id,
    });
  });
  (lets ?? []).forEach((l: { id: string; written_at: string; deliver_during: string }) =>
    items.push({
      date: l.written_at,
      type: 'letter',
      id: l.id,
      label: `Letter → ${l.deliver_during}`,
    }),
  );
  (bads ?? []).forEach((b: { id: string; earned_at: string; badge_id: string }) =>
    items.push({ date: b.earned_at, type: 'badge', id: b.id, label: b.badge_id }),
  );
  (pracs ?? []).forEach((p: { id: string; created_at: string; type: string; mood: string | null; prompt: string | null }) =>
    items.push({
      date: p.created_at,
      type: 'practice',
      id: p.id,
      label: PRACTICE_LABELS[p.type] ?? p.type,
      mood: p.mood,
      practiceType: p.type,
    }),
  );
  return items;
}
