import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkHoldPendingPause } from '../domain/bulk-hold';
import {
  bulkHoldPendingQueryKey,
  getBulkHoldPendingQueryOptions,
} from '../public-queries';

export type { BulkHoldPendingPause };
export { bulkHoldPendingQueryKey };

export interface UseBulkHoldPendingOptions {
  userId: string | undefined;
  /** When false, skips network fetch (e.g. success step should not repopulate the teaser). */
  fetchEnabled: boolean;
  /** Increment to force a reload after a failed apply. */
  refetchNonce: number;
}

/**
 * Loads expired pause instances in the bulk-hold window that lack `outcome_logged`.
 */
export function useBulkHoldPending({ userId, fetchEnabled, refetchNonce }: UseBulkHoldPendingOptions) {
  const queryClient = useQueryClient();

  const { data: pending = [] } = useQuery(
    getBulkHoldPendingQueryOptions({ userId, fetchEnabled, refetchNonce }),
  );

  const setPending = useCallback(
    (rows: BulkHoldPendingPause[]) => {
      if (!userId) return;
      queryClient.setQueryData<BulkHoldPendingPause[]>(bulkHoldPendingQueryKey(userId, refetchNonce), rows);
    },
    [queryClient, userId, refetchNonce],
  );

  return { pending, setPending };
}
