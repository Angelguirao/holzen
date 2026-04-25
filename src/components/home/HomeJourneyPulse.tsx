import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, ChevronRight } from 'lucide-react';
import { usePauseStatsData, type PauseFullRow } from '@/hooks/use-pause-stats-data';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { useBadges } from '@/hooks/use-badges';
import { useSubscription } from '@/hooks/use-subscription';
import { computePauseScore } from '@/lib/stats/pause-score';
import { journeyPath } from '@/lib/app-routes';
import { TrendChip } from '@/components/stats/TrendChip';
import { Skeleton } from '@/components/ui/skeleton';
import { homeInWidget } from '@/components/home/home-widget-styles';
import type { BadgeSnapshot } from '@/lib/badges/compute';
import { cn } from '@/lib/utils';

function pickClosestUnearned(snapshots: BadgeSnapshot[], subscribed: boolean): BadgeSnapshot | null {
  const candidates = snapshots.filter((s) => !s.earned && s.requirement > 0 && (!s.proOnly || subscribed));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.progress >= b.progress ? a : b));
}

export function HomeJourneyPulse() {
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const { ready, rows, stepEvents, companionEvents } = usePauseStatsData();
  const { data: holdGoal } = useHoldGoalProfile();
  const scoreData = useMemo(() => {
    const completedRows: PauseFullRow[] = rows.filter((r) => r.state === 'completed');
    return computePauseScore({
      completedRows,
      stepEvents,
      companionEvents,
      holdGoal: holdGoal ?? null,
    });
  }, [rows, stepEvents, companionEvents, holdGoal]);

  const { snapshots } = useBadges({
    rows,
    stepEvents,
    companionEvents,
    holdGoal: holdGoal ?? null,
  });
  const nextBadge = useMemo(() => pickClosestUnearned(snapshots, subscribed), [snapshots, subscribed]);

  if (!ready) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2 w-full max-w-xs" />
      </div>
    );
  }

  if (!scoreData) {
    return (
      <Link to={journeyPath('stats')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        {t('home.journeyPulse.noScore')}
        <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
      </Link>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0" aria-hidden>
          <svg viewBox="0 0 36 36" className="h-full w-full">
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${scoreData.score}, 100`} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-sm font-semibold tabular-nums leading-none">{scoreData.score}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{t('home.journeyPulse.scoreLabel')}</p>
          <div className="mt-1">
            <TrendChip trend={scoreData.trend} />
          </div>
        </div>
      </div>

      {nextBadge ? (
        <div className={cn(homeInWidget.inset, 'space-y-2')}>
          <p className={homeInWidget.kicker}>{t('home.journeyPulse.closestBadge')}</p>
          <p className="text-sm">{t(nextBadge.labelKey, { defaultValue: nextBadge.id })}</p>
          <p className={homeInWidget.meta}>
            {t('home.journeyPulse.badgeProgress', {
              current: nextBadge.current,
              requirement: nextBadge.requirement,
            })}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link to={journeyPath('stats')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t('home.journeyPulse.openStats')}
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden />
        </Link>
        <Link to={journeyPath('badges')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Award className="h-3.5 w-3.5" aria-hidden />
          {t('home.journeyPulse.openBadges')}
        </Link>
        <Link to={journeyPath('activity')} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {t('home.journeyPulse.openActivity')}
        </Link>
      </div>
    </div>
  );
}
