import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowDownRight, ArrowUpRight, Hand, Minus } from 'lucide-react';
import { usePauseStatsData } from '@/hooks/use-pause-stats-data';
import type { PauseFullRow } from '@/lib/pause-stats-data-query';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { useBadges } from '@/hooks/use-badges';
import { useSubscription } from '@/hooks/use-subscription';
import { computePauseScore } from '@/lib/stats/pause-score';
import { journeyPath } from '@/lib/app-routes';
import { Skeleton } from '@/components/ui/skeleton';
import type { BadgeSnapshot } from '@/lib/badges/compute';
import { cn } from '@/lib/utils';
import { homeInWidget } from '@/components/home/home-widget-styles';

type ScoreTrend = 'improving' | 'declining' | 'stable';

function pickClosestUnearned(snapshots: BadgeSnapshot[], subscribed: boolean): BadgeSnapshot | null {
  const candidates = snapshots.filter((s) => !s.earned && s.requirement > 0 && (!s.proOnly || subscribed));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.progress >= b.progress ? a : b));
}

function ScoreTrendRow({ trend, sampleSize }: { trend: ScoreTrend; sampleSize: number }) {
  const { t } = useTranslation();
  if (sampleSize < 6) return null;
  const Icon = trend === 'improving' ? ArrowUpRight : trend === 'declining' ? ArrowDownRight : Minus;
  const color =
    trend === 'improving'
      ? 'text-emerald-600 dark:text-emerald-500'
      : trend === 'declining'
        ? 'text-destructive/85'
        : 'text-muted-foreground';
  return (
    <p className={cn('mt-2 inline-flex items-center gap-1 pl-2 text-[10px] font-semibold uppercase tracking-widest', color)}>
      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
      <span>{t(`holzenScore.${trend}`)}</span>
    </p>
  );
}

/**
 * Two-tile row under Today: personal Holzen Score + In Motion (next badge progress).
 */
export function HomeStatTiles() {
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
    trackedAssetId: holdGoal?.trackedAssetId,
  });
  const nextBadge = useMemo(() => pickClosestUnearned(snapshots, subscribed), [snapshots, subscribed]);

  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[128px] rounded-xl" />
        <Skeleton className="h-[128px] rounded-xl" />
      </div>
    );
  }

  const progressPct =
    nextBadge && nextBadge.requirement > 0
      ? Math.min(100, Math.round((nextBadge.current / nextBadge.requirement) * 100))
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        to={journeyPath('stats')}
        aria-label={t('home.journeyPulse.openStats')}
        className={cn(
          'relative flex min-h-[128px] flex-col overflow-hidden rounded-xl border border-border/40 p-3',
          'bg-gradient-to-b from-primary/[0.08] via-card/45 to-card/40',
          'transition-colors hover:border-primary/30 hover:from-primary/[0.11] hover:via-card/55 hover:to-card/50',
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-primary/50 via-primary/25 to-transparent"
          aria-hidden
        />
        <p className={cn(homeInWidget.kicker, 'pl-2 text-[10px] tracking-widest')}>{t('home.statTiles.holzenScore')}</p>
        {scoreData ? (
          <div className="mt-3 flex flex-1 flex-col justify-between pl-2">
            <div>
              <p className="text-[2.65rem] font-semibold tabular-nums leading-none tracking-tight text-foreground">
                {scoreData.score}
              </p>
              <ScoreTrendRow trend={scoreData.trend} sampleSize={scoreData.sampleSize} />
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted/70" aria-hidden>
              <div
                className="h-full rounded-full bg-primary/55 transition-[width] duration-300 ease-out"
                style={{ width: `${scoreData.score}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={cn(homeInWidget.meta, 'mt-3 flex-1 pl-2 leading-snug')}>{t('home.journeyPulse.noScore')}</p>
        )}
      </Link>

      <Link
        to={journeyPath('badges')}
        aria-label={t('home.journeyPulse.openBadges')}
        className={cn(
          'relative flex min-h-[128px] flex-col overflow-hidden rounded-xl border border-border/40 p-3',
          'bg-gradient-to-b from-amber-500/[0.07] via-card/42 to-card/38',
          'transition-colors hover:border-amber-500/30 hover:from-amber-500/[0.1] hover:via-card/50 hover:to-card/44',
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-3 left-0 w-px bg-gradient-to-b from-amber-500/45 via-amber-500/18 to-transparent"
          aria-hidden
        />
        <p className={cn(homeInWidget.kicker, 'pl-2 text-[10px] tracking-widest')}>{t('home.statTiles.inMotion')}</p>
        {nextBadge ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col justify-between pl-2">
            <div className="flex min-h-0 items-start gap-2">
              <Hand className="mt-0.5 h-5 w-5 shrink-0 text-amber-600/70 dark:text-amber-400/60" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {t(nextBadge.labelKey, { defaultValue: nextBadge.id })}
                </p>
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {t('home.journeyPulse.badgeProgress', {
                    current: nextBadge.current,
                    requirement: nextBadge.requirement,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted/70" aria-hidden>
              <div
                className="h-full rounded-full bg-amber-500/55 transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className={cn(homeInWidget.meta, 'mt-3 flex-1 pl-2 leading-snug')}>{t('home.statTiles.noBadgeProgress')}</p>
        )}
      </Link>
    </div>
  );
}
