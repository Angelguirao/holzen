import { PAUSE_STATS_DATA_QUERY_KEY } from '@/hooks/use-pause-stats-data';
import { getHolzenQueryClient } from '@/lib/holzen-query-client-ref';

/**
 * Call after a pause reaches `completed` so Home (Journey card), Journey → Stats, and
 * badges re-read from Supabase without waiting for the stats query `staleTime` window.
 */
export function invalidatePauseStatsDataForUser(userId: string | null | undefined): void {
  if (!userId) return;
  const qc = getHolzenQueryClient();
  if (!qc) return;
  void qc.invalidateQueries({ queryKey: PAUSE_STATS_DATA_QUERY_KEY(userId) });
}
