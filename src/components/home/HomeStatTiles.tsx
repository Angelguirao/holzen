import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hand } from 'lucide-react';
import { usePauseStatsData, type PauseFullRow } from '@/hooks/use-pause-stats-data';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { useBadges } from '@/hooks/use-badges';
import { useSubscription } from '@/hooks/use-subscription';
import { computePauseScore } from '@/lib/stats/pause-score';
import { journeyPath } from '@/lib/app-routes';
import { Skeleton } from '@/components/ui/skeleton';
import type { BadgeSnapshot } from '@/lib/badges/compute';
import { cn } from '@/lib/utils';

function pickClosestUnearned(snapshots: BadgeSnapshot[], subscribed: boolean): BadgeSnapshot | null {
  const candidates = snapshots.filter((s) => !s.earned && s.requirement > 0 && (!s.proOnly || subscribed));
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.progress >= b.progress ? a : b));
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
        className={cn(
          'rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:bg-card/60',
          'flex flex-col justify-between min-h-[128px]',
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {t('home.statTiles.holzenScore')}
        </p>
        {scoreData ? (
          <div className="mt-2">
            <p className="text-4xl font-normal tabular-nums leading-none tracking-tight text-foreground">{scoreData.score}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('home.journeyPulse.scoreLabel')}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t('home.journeyPulse.noScore')}</p>
        )}
      </Link>

      <div className="rounded-xl border border-border/40 bg-card/40 p-3 flex flex-col justify-between min-h-[128px]">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          {t('home.statTiles.inMotion')}
        </p>
        {nextBadge ? (
          <>
            <div className="mt-2 flex items-start gap-2 min-h-0">
              <Hand className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
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
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t('home.statTiles.noBadgeProgress')}</p>
        )}
        {nextBadge ? (
          <Link to={journeyPath('badges')} className="mt-2 text-xs font-medium text-primary hover:underline">
            {t('home.journeyPulse.openBadges')}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
