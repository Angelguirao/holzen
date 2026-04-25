import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { journeyPath } from '@/lib/app-routes';
import { usePauseStatsData, type PauseFullRow } from '@/hooks/use-pause-stats-data';
import { useHoldGoalProfile } from '@/hooks/use-hold-goal';
import { computePauseScore } from '@/lib/stats/pause-score';
import { TrendChip } from '@/components/stats/TrendChip';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Compact Journey entry on Home: Holzen score + link to full stats (Journey tab
 * unchanged — this is a preview, not a replacement).
 */
export function JourneyHomeCard() {
  const { t } = useTranslation();
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

  if (!ready) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3"
        aria-busy
        aria-label={t('journey.homeCardLoading', { defaultValue: 'Loading journey summary' })}
      >
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full max-w-xs" />
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <Link
        to={journeyPath('stats')}
        className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3 transition-colors hover:bg-muted/30"
      >
        <Route className="h-4 w-4 shrink-0 text-secondary-foreground mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-foreground">
            {t('journey.homeCardTitle', { defaultValue: 'Your journey' })}
          </p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {t('journey.homeCardSubtitle', {
              defaultValue: 'Stats, insights, badges, and activity',
            })}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" aria-hidden />
      </Link>
    );
  }

  return (
    <Link
      to={journeyPath('stats')}
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-3 transition-colors hover:bg-muted/30"
      aria-label={t('journey.homeCardScoreAria', {
        defaultValue: 'Holzen score {{score}}, open full journey stats',
        score: scoreData.score,
      })}
    >
      <div
        className="relative h-12 w-12 shrink-0"
        aria-hidden
      >
        <svg viewBox="0 0 36 36" className="h-full w-full">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${scoreData.score}, 100`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold tabular-nums leading-none">{scoreData.score}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-medium text-foreground">
          {t('journey.homeCardTitle', { defaultValue: 'Your journey' })}
        </p>
        <p className="text-xs text-muted-foreground leading-snug mt-0.5">
          {t('journey.homeCardScoreLine', {
            defaultValue: 'Full stats, insights, badges, and activity — same as Journey → Stats',
          })}
        </p>
        {scoreData.sampleSize > 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground/90 mt-1">
            {t('journey.homeCardWindow', {
              defaultValue: 'Based on your last {{count}} completed pauses',
              count: scoreData.sampleSize,
            })}
          </p>
        ) : null}
        <div className="mt-1">
          <TrendChip trend={scoreData.trend} />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 self-center" aria-hidden />
    </Link>
  );
}
