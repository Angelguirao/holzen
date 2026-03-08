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
      const [{ data: refs }, { data: rits }, { data: lets }, { data: bads }] = await Promise.all([
        supabase.from('reflections').select('id, created_at, mood').eq('user_id', user.id),
        supabase.from('ritual_completions').select('id, created_at, decision, template').eq('user_id', user.id),
        supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id),
        supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id),
      ]);

      const items: CalendarActivity[] = [];
      (refs ?? []).forEach((r: any) => items.push({ date: r.created_at, type: 'reflection', mood: r.mood, id: r.id }));
      (rits ?? []).forEach((r: any) => items.push({ date: r.created_at, type: 'ritual', id: r.id, label: `${r.template} · ${r.decision}` }));
      (lets ?? []).forEach((l: any) => items.push({ date: l.written_at, type: 'letter', id: l.id, label: `Letter → ${l.deliver_during}` }));
      (bads ?? []).forEach((b: any) => items.push({ date: b.earned_at, type: 'badge', id: b.id, label: b.badge_id }));
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
