import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import {
  getHistoryThreadQueryOptions,
  type HistoryThreadRow,
} from '../public-queries';

export type { HistoryThreadRow };

export function useCompanionHistoryThread(options: {
  companion: RegenerateCompanionSlot;
  currentPauseInstanceId?: string | null;
  limit?: number;
}) {
  const { companion, currentPauseInstanceId, limit = 5 } = options;
  const { user } = useAuth();
  const userId = user?.id;

  const { data: rawRows } = useQuery(getHistoryThreadQueryOptions({ userId, companion, limit }));

  const rows = useMemo((): HistoryThreadRow[] | null => {
    if (!userId) return null;
    if (rawRows === undefined) return null;
    return rawRows
      .filter((r) => r.pause_instance_id !== currentPauseInstanceId)
      .slice(0, limit);
  }, [userId, rawRows, currentPauseInstanceId, limit]);

  return { rows };
}
