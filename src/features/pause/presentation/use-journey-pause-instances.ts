import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { getJourneyPauseInstancesQueryOptions, type JourneyPauseRow } from '../public-queries';

export type { JourneyPauseRow };

function countDistinctPauseDays(rows: readonly JourneyPauseRow[]): number {
  const completed = rows.filter((r) => r.state === 'completed');
  const dayKeys = new Set<string>();
  for (const r of completed) {
    const iso = r.completed_at ?? r.engaged_at ?? r.created_at;
    const d = new Date(iso);
    dayKeys.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString());
  }
  return dayKeys.size;
}

/** Journey overview — minimal `pause_instances` rows for streak + completed totals. */
export function useJourneyPauseInstances() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: rows = [], isLoading } = useQuery(getJourneyPauseInstancesQueryOptions(userId));

  const completedCount = useMemo(
    () => rows.filter((r) => r.state === 'completed').length,
    [rows],
  );

  const streakDays = useMemo(() => countDistinctPauseDays(rows), [rows]);

  return { rows, isLoading, completedCount, streakDays };
}
