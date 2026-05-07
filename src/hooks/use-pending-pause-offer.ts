import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { getPendingPauseOfferQueryOptions, pendingPauseOfferQueryKey } from '@/lib/pending-pause-offer-query';

export type { PendingPauseOfferRow } from '@/lib/pending-pause-offer-query';
export { pendingPauseOfferQueryKey } from '@/lib/pending-pause-offer-query';

/**
 * The single `state = 'pending'` pause row for the user (if any), plus a
 * short reflection preview when artifacts exist. Subscribes to
 * `pause_instances` so cron-created offers surface without refresh.
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

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`pause-pending-offer-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void bump();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, bump]);

  return {
    pending: query.data ?? null,
    loaded: !userId || query.isFetched,
    refresh: bump,
  };
}
