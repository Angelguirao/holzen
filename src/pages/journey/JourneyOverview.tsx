import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { JourneyStreakCard } from '@/components/journey/JourneyStreakCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getJourneyPauseInstancesQueryOptions } from '@/features/pause/public-queries';
import { trackEvent } from '@/lib/posthog';
import { Skeleton } from '@/components/ui/skeleton';

export default function JourneyOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const viewedRef = useRef(false);

  const { data: rows = [], isLoading } = useQuery(getJourneyPauseInstancesQueryOptions(userId));

  const completedCount = rows.filter((r) => r.state === 'completed').length;

  const streakDays = useMemo(() => {
    const completed = rows.filter((r) => r.state === 'completed');
    const dayKeys = new Set<string>();
    for (const r of completed) {
      const iso = r.completed_at ?? r.engaged_at ?? r.created_at;
      const d = new Date(iso);
      dayKeys.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString());
    }
    return dayKeys.size;
  }, [rows]);

  useEffect(() => {
    if (viewedRef.current || isLoading) return;
    viewedRef.current = true;
    trackEvent('journey.overview_viewed', {
      streak_days: streakDays,
      completed_pause_count: completedCount,
    });
  }, [isLoading, streakDays, completedCount]);

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

      <section className="rounded-2xl border border-border/40 bg-card/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('journey.overview.completed.label', { defaultValue: 'Completed pauses' })}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{completedCount}</p>
      </section>

      <Button asChild variant="outline" className="w-full">
        <Link to="/archive">
          {t('journey.overview.archiveCta', { defaultValue: 'Open your pause library' })}
        </Link>
      </Button>
    </div>
  );
}
