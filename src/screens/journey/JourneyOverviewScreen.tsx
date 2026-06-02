import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { JourneyStreakCard } from '@/screens/journey/components/JourneyStreakCard';
import { JourneyPracticeXpBreakdown } from '@/screens/journey/components/JourneyPracticeXpBreakdown';
import { Button } from '@/components/ui/button';
import { useJourneyPauseInstances } from '@/features/pause/public-hooks';
import { usePracticeSummary } from '@/features/pause/presentation/practice/use-practice-summary';
import { EMPTY_PRACTICE_XP_BY_SIGNAL } from '@/features/pause/domain/practice/practice-xp-by-signal';
import { trackJourneyOverviewViewed } from '@/features/pause/public-hooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function JourneyOverview() {
  const { t } = useTranslation();
  const { rows, isLoading, completedCount, streakDays } = useJourneyPauseInstances();
  const { summary: practiceSummary, isLoading: practiceLoading } = usePracticeSummary();
  const viewedRef = useRef(false);

  const completedTotal = practiceSummary?.completedPauseCount ?? completedCount;
  const presenceXp = practiceSummary?.presenceXpTotal ?? 0;
  const briefCount = practiceSummary?.completedBriefCount ?? 0;
  const deepCount = practiceSummary?.completedDeepCount ?? 0;
  const showPracticeMix = completedTotal > 0 && (briefCount > 0 || deepCount > 0);

  useEffect(() => {
    if (viewedRef.current || isLoading) return;
    viewedRef.current = true;
    trackJourneyOverviewViewed({
      streak_days: streakDays,
      completed_pause_count: completedTotal,
    });
  }, [isLoading, streakDays, completedTotal]);

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="font-editorial text-2xl tracking-tight">
          {t('journey.overview.title', { defaultValue: 'Journey' })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('journey.overview.subtitle', {
            defaultValue: 'Your pause rhythm at a glance.',
          })}
        </p>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : (
        <JourneyStreakCard rows={rows} />
      )}

      <section className="rounded-2xl border border-border/40 bg-card/40 p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t('journey.overview.presence.label', { defaultValue: 'Presence' })}
          </p>
          {practiceLoading ? (
            <Skeleton className="mt-2 h-9 w-24" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums">{presenceXp}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t('journey.overview.presence.footnote', { defaultValue: 'Lifetime practice XP' })}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t('journey.overview.completed.label', { defaultValue: 'Completed pauses' })}
          </p>
          {practiceLoading ? (
            <Skeleton className="mt-2 h-9 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-semibold tabular-nums">{completedTotal}</p>
          )}
          {showPracticeMix ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('journey.overview.completed.mix', {
                defaultValue: '{{deep}} deep · {{brief}} brief',
                deep: deepCount,
                brief: briefCount,
              })}
            </p>
          ) : null}
        </div>
        <JourneyPracticeXpBreakdown
          xpBySignal={practiceSummary?.xpBySignal ?? EMPTY_PRACTICE_XP_BY_SIGNAL}
          presenceXpTotal={presenceXp}
          isLoading={practiceLoading}
        />
      </section>

      <Button asChild variant="outline" className="w-full">
        <Link to="/archive">
          {t('journey.overview.archiveCta', { defaultValue: 'Open your pause library' })}
        </Link>
      </Button>
    </div>
  );
}
