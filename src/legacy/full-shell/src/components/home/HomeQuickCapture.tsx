import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/public';
import { getHomeQuickCaptureLastPauseQueryOptions } from '@/legacy/full-shell/src/lib/home-quick-capture-last-pause-query';
import { practiceEntriesWeeklyCountQueryKey } from '@/legacy/full-shell/src/lib/practice-entries-weekly-count-query';
import { practicePrimarySuggestionQueryKey } from '@/legacy/full-shell/src/lib/practice-primary-suggestion-query';
import { toolsHubDataQueryKey } from '@/legacy/full-shell/src/lib/tools-hub-data-query';
import { invalidateHistoryCalendarActivities } from '@/legacy/full-shell/src/lib/history-calendar-activities-query-key';
import { TOOLS } from '@/lib/app-routes';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

const QUICK_MOODS = ['calm', 'anxious', 'fomo', 'uncertain'] as const;

function relTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(0, 'day');
  if (diffDays === 1) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-1, 'day');
  if (diffDays < 7) return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-diffDays, 'day');
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function HomeQuickCapture() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: lastPause = null, isPending: loadingLib } = useQuery(
    getHomeQuickCaptureLastPauseQueryOptions(userId),
  );

  const saveCheckin = useCallback(async () => {
    if (!user) return;
    const trimmed = note.trim();
    if (!mood && !trimmed) {
      toast.message(t('home.quickCapture.checkinNeedOne'));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'checkin',
        mood: mood ?? 'calm',
        intensity: 3,
        trigger_text: trimmed || null,
      });
      if (error) {
        toast(t('common.tryAgain'));
        return;
      }
      void queryClient.invalidateQueries({ queryKey: practiceEntriesWeeklyCountQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: toolsHubDataQueryKey(user.id) });
      void queryClient.invalidateQueries({ queryKey: practicePrimarySuggestionQueryKey(user.id) });
      invalidateHistoryCalendarActivities(queryClient, user.id);
      hapticFeedback('success');
      setMood(null);
      setNote('');
      toast.success(t('practice.checkinSaved'));
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, mood, note, t, queryClient]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className={homeInWidget.kicker}>{t('home.quickCapture.checkinTitle')}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMood((prev) => (prev === m ? null : m));
                hapticFeedback('light');
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-mono uppercase tracking-wide transition-colors',
                mood === m
                  ? 'border-nox-border-focus/50 bg-nox-background-accent/30 text-foreground'
                  : 'border-border/50 bg-muted/20 text-muted-foreground hover:border-border',
              )}
            >
              <MoodIcon mood={m} size={14} className="opacity-80" />
              {t(`moodCheck.moods.${m}`)}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('home.quickCapture.checkinPlaceholder')}
          className="min-h-[64px] resize-y text-sm font-sans"
          maxLength={500}
        />
        <div className="flex flex-wrap items-center gap-2">
          <LoadingButton
            type="button"
            size="sm"
            onClick={() => void saveCheckin()}
            loading={saving}
            loadingText={t('common.loading')}
            className="text-xs"
          >
            {t('home.quickCapture.checkinSave')}
          </LoadingButton>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" asChild>
            <Link to={TOOLS.practice.checkin}>{t('home.quickCapture.checkinOpenTools')}</Link>
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/50" role="separator" />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={homeInWidget.kicker}>{t('home.quickCapture.recentPauseTitle')}</p>
          <Link to="/archive" className="text-[10px] font-sans font-medium uppercase tracking-wider text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline">
            {t('home.quickCapture.libraryOpen')}
          </Link>
        </div>
        {loadingLib ? (
          <Skeleton className="h-3 w-44" />
        ) : lastPause?.created_at || lastPause?.terminal_at ? (
          <p className="text-sm text-foreground/90">
            <BookOpen className="mr-1.5 inline h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            {t('home.quickCapture.recentPauseBlurb')}
            <span className="ml-2 text-[10px] font-mono text-muted-foreground">
              {relTime(lastPause.terminal_at ?? lastPause.created_at!, i18n.language)}
            </span>
          </p>
        ) : (
          <p className={homeInWidget.bodyMuted}>{t('home.quickCapture.libraryEmpty')}</p>
        )}
      </div>
    </div>
  );
}
