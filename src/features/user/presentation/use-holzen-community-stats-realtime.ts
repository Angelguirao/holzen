import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeHolzenCommunityStats } from '@/features/user/infrastructure/realtime/holzen-community-stats-realtime';
import { HOLZEN_NUMBER_QUERY_KEY } from '@/features/user/infrastructure/queries/holzen-number-query';

/**
 * Invalidate the public “paused today” aggregate when Postgres refreshes
 * `holzen_community_stats` (any user's pause activity). Home-only wiring.
 */
export function useHolzenCommunityStatsRealtime(enabled: boolean) {
  const queryClient = useQueryClient();
  const clientRef = useRef(queryClient);
  clientRef.current = queryClient;

  useEffect(() => {
    if (!enabled) return;

    return subscribeHolzenCommunityStats(() => {
      void clientRef.current.invalidateQueries({ queryKey: HOLZEN_NUMBER_QUERY_KEY });
    });
  }, [enabled]);
}
