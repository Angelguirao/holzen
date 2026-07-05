import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import {
  getPendingPauseOfferQueryOptions,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from '@/features/pause/public-queries';

export type { PendingPauseOfferRow };
export { pendingPauseOfferQueryKey };

/**
 * The single `state = 'pending'` pause row for the user (if any), plus a
 * short reflection preview when artifacts exist. Resyncs via the shared
 * `pause_instances` Realtime handler in `useOpenPauseHomePreview`.
 */
export function usePendingPauseOffer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery(getPendingPauseOfferQueryOptions(userId));

  const bump = useCallback(() => {
    if (!userId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: pendingPauseOfferQueryKey(userId) });
  }, [queryClient, userId]);

  return {
    pending: query.data ?? null,
    loaded: !userId || query.isFetched,
    refresh: bump,
  };
}
