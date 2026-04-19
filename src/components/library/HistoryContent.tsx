import { useTranslation } from 'react-i18next';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { HistoryCalendar, type CalendarActivity } from '@/components/HistoryCalendar';

const HistoryContent = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: refs }, { data: lets }, { data: bads }, { data: pracs }] = await Promise.all([
        supabase
          .from('reflections')
          .select('id, created_at, mood, mood_after, outcome, breathing_completed')
          .eq('user_id', user.id),
        supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id),
        supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id),
        supabase.from('practice_entries').select('id, created_at, type, mood, prompt').eq('user_id', user.id),
      ]);

      const PRACTICE_LABELS: Record<string, string> = {
        checkin: 'Emotional check-in',
        journal: 'Guided journal',
        bodyscan: 'Body scan',
        replay: 'Reflection replay',
      };

      const items: CalendarActivity[] = [];
      // Activity timeline shows engaged pauses only — those the user actually completed.
      (refs ?? [])
        .filter((r: any) => r.breathing_completed && r.mood && r.mood_after && r.outcome)
        .forEach((r: any) => items.push({ date: r.created_at, type: 'reflection', mood: r.mood, id: r.id }));
      (lets ?? []).forEach((l: any) => items.push({ date: l.written_at, type: 'letter', id: l.id, label: `Letter → ${l.deliver_during}` }));
      (bads ?? []).forEach((b: any) => items.push({ date: b.earned_at, type: 'badge', id: b.id, label: b.badge_id }));
      (pracs ?? []).forEach((p: any) => items.push({
        date: p.created_at,
        type: 'practice',
        id: p.id,
        label: PRACTICE_LABELS[p.type] ?? p.type,
        mood: p.mood,
        practiceType: p.type,
      }));
      setActivities(items);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  return (
    <HistoryCalendar
      activities={activities}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
    />
  );
};

export default HistoryContent;
