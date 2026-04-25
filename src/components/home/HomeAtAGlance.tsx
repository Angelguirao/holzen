import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Award, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { usePauseStatsData } from '@/hooks/use-pause-stats-data';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { useBadges } from '@/hooks/use-badges';
import { journeyPath, TOOLS } from '@/lib/app-routes';
import { MoodIcon } from '@/components/icons/MoodIcon';
import type { BadgeSnapshot } from '@/lib/badges/compute';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { hapticFeedback } from '@/lib/haptics';
import { toast } from 'sonner';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

const QUICK_MOODS = ['calm', 'anxious', 'fomo', 'uncertain'] as const;

interface LibraryRow {
  id: string;
  created_at: string;
  title: string | null;
  source_type: string | null;
}

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

function pickClosestUnearned(snapshots: BadgeSnapshot[], subscribed: boolean): BadgeSnapshot | null {
  const candidates = snapshots.filter((s) => !s.earned && s.requirement > 0 && (!s.proOnly || subscribed));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.progress >= b.progress ? a : b));
}

/**
 * Home “summary” strip: recent library saves, one-tap + note check-in, next-badge progress.
 */
export function HomeAtAGlance() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { subscribed } = useSubscription();
  const { ready, rows, stepEvents, companionEvents } = usePauseStatsData();
  const { data: holdGoal } = useHoldGoalProfile();
  const { snapshots } = useBadges({
    rows,
    stepEvents,
    companionEvents,
    holdGoal: holdGoal ?? null,
  });

  const [libItems, setLibItems] = useState<LibraryRow[] | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('library_items')
        .select('id, created_at, title, source_type')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(3);
      if (cancelled) return;
      if (error) {
        setLibItems([]);
        return;
      }
      setLibItems((data ?? []) as LibraryRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const nextBadge = useMemo(() => pickClosestUnearned(snapshots, subscribed), [snapshots, subscribed]);

  const saveCheckin = useCallback(async () => {
    if (!user) return;
    const trimmed = note.trim();
    if (!mood && !trimmed) {
      toast.message(t('home.atAGlance.checkinNeedOne'));
      return;
    }
    setSaving(true);
    try {
      await supabase.from('practice_entries').insert({
        user_id: user.id,
        type: 'checkin',
        mood: mood ?? 'calm',
        intensity: 3,
        trigger_text: trimmed || null,
      });
      hapticFeedback('success');
      setNote('');
      setMood(null);
      toast.success(t('practice.checkinSaved'));
    } catch {
      toast(t('common.tryAgain'));
    } finally {
      setSaving(false);
    }
  }, [user, mood, note, t]);

  const libLoading = user && libItems === null;
  const libEmpty = libItems && libItems.length === 0;

  return (
    <div className="space-y-5">
      {/* Library */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={homeInWidget.kicker}>{t('home.atAGlance.libraryTitle')}</p>
          <Link
            to="/library"
            className="text-[10px] font-mono uppercase tracking-wider text-primary hover:underline"
          >
            {t('home.atAGlance.libraryOpen')}
          </Link>
        </div>
        {libLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full max-w-sm" />
            <Skeleton className="h-3 w-2/3 max-w-xs" />
          </div>
        ) : libEmpty ? (
          <p className={homeInWidget.bodyMuted}>
            {t('home.atAGlance.libraryEmpty')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {(libItems ?? []).map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-foreground/90">
                  <BookOpen className="inline h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" aria-hidden />
                  {row.title?.trim() || t('home.atAGlance.libraryUntitled')}
                </span>
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                  {relTime(row.created_at, i18n.language)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="h-px bg-border/50" role="separator" />

      {/* Quick check-in */}
      <div className="space-y-2">
        <p className={homeInWidget.kicker}>{t('home.atAGlance.checkinTitle')}</p>
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
                  ? 'border-primary/60 bg-primary/10 text-foreground'
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
          placeholder={t('home.atAGlance.checkinPlaceholder')}
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
            {t('home.atAGlance.checkinSave')}
          </LoadingButton>
          <Button type="button" variant="ghost" size="sm" className="text-xs h-8" asChild>
            <Link to={TOOLS.practice.checkin}>{t('home.atAGlance.checkinOpenTools')}</Link>
          </Button>
        </div>
      </div>

      <div className="h-px bg-border/50" role="separator" />

      {/* Next badge */}
      <div className="space-y-2">
        <p className={homeInWidget.kicker}>{t('home.atAGlance.badgeTitle')}</p>
        {!ready ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-2 w-full max-w-xs" />
          </div>
        ) : !nextBadge ? (
          <p className={cn(homeInWidget.bodyMuted, 'text-sm')}>
            {t('home.atAGlance.allBadgesEarned')}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground leading-snug">
              {t(nextBadge.labelKey, { defaultValue: nextBadge.id })}
            </p>
            <p className={homeInWidget.meta}>
              {t('home.atAGlance.badgeProgress', {
                current: nextBadge.current,
                requirement: nextBadge.requirement,
              })}
            </p>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden max-w-xs">
              <div
                className="h-full rounded-full bg-primary/70 transition-all"
                style={{ width: `${Math.round(nextBadge.progress * 100)}%` }}
              />
            </div>
          </>
        )}
        <Link
          to={journeyPath('badges')}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-1"
        >
          <Award className="h-3.5 w-3.5" aria-hidden />
          {t('home.atAGlance.badgeOpen')}
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
