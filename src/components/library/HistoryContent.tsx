import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HistoryCalendar, type CalendarActivity } from '@/components/HistoryCalendar';

const PRACTICE_LABELS: Record<string, string> = {
  checkin: 'Emotional check-in',
  journal: 'Guided journal',
  bodyscan: 'Body scan',
  replay: 'Pause replay',
};

function historyCalendarActivitiesQueryKey(userId: string) {
  return ['history-calendar', 'activities', userId] as const;
}

async function fetchHistoryCalendarActivities(userId: string): Promise<CalendarActivity[]> {
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

const HistoryContent = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    data: activities = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: userId ? historyCalendarActivitiesQueryKey(userId) : ['history-calendar', 'activities', 'none'],
    queryFn: () => fetchHistoryCalendarActivities(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loading = Boolean(userId) && isPending;
  const loadFailed = Boolean(userId) && isError;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col gap-3 text-left">
          <p>{t('journey.activityLoadFailed')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              if (userId) void queryClient.invalidateQueries({ queryKey: historyCalendarActivitiesQueryKey(userId) });
            }}
          >
            {t('common.tryAgain')}
          </Button>
        </AlertDescription>
      </Alert>
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
