import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HistoryCalendar, type CalendarActivity } from '@/components/HistoryCalendar';

const HistoryContent = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setLoadFailed(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
    const load = async () => {
      try {
        const [rP, rL, rB, rPr, rLib] = await Promise.all([
          supabase
            .from('v_pause_full' as never)
            .select('id, created_at, completed_at, engaged_at, initial_mood, shift_mood, outcome, state, has_breath_completed')
            .eq('user_id', user.id)
            .eq('state', 'completed'),
          supabase.from('future_letters').select('id, written_at, deliver_during').eq('user_id', user.id),
          supabase.from('user_badges').select('id, earned_at, badge_id').eq('user_id', user.id),
          supabase.from('practice_entries').select('id, created_at, type, mood, prompt').eq('user_id', user.id),
          supabase
            .from('library_items')
            .select('id, created_at, title, source_type, status')
            .eq('user_id', user.id)
            .neq('status', 'deleted'),
        ]);
        if (cancelled) return;
        if (rP.error || rL.error || rB.error || rPr.error || rLib.error) {
          if (!cancelled) setLoadFailed(true);
          return;
        }
        const pauses = rP.data;
        const lets = rL.data;
        const bads = rB.data;
        const pracs = rPr.data;
        const libItems = rLib.data;

        const PRACTICE_LABELS: Record<string, string> = {
          checkin: 'Emotional check-in',
          journal: 'Guided journal',
          bodyscan: 'Body scan',
          replay: 'Pause replay',
        };

        const items: CalendarActivity[] = [];
        // Completed pauses only; use completed_at (fall back to engaged_at /
        // created_at) to bucket into the right local day.
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
        (libItems ?? []).forEach(
          (i: { id: string; created_at: string; title: string | null; source_type: string | null; status: string | null }) =>
            items.push({
              date: i.created_at,
              type: 'library',
              id: i.id,
              label: i.title?.trim() || i.source_type || 'Saved to library',
            }),
        );
        if (!cancelled) {
          setActivities(items);
          setLoadFailed(false);
        }
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, reloadNonce]);

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
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setReloadNonce((n) => n + 1)}>
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
