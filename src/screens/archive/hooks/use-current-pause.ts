/**
 * Read the caller's single open (active|engaged) pause, if any.
 *
 * Uses `v_pause_current` under `security_invoker = true`, so RLS handles
 * ownership — we don't need to filter by user_id manually.
 *
 * Returns null when no open pause exists. Subscribes to realtime changes
 * on the underlying `pause_instances` rows so surface banners (Archive,
 * Tools, etc.) react when state changes.
 */

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/public';
import {
  currentPauseQueryKey,
  getCurrentPauseQueryOptions,
  type CurrentPauseRow,
} from '@/features/pause/public-queries';

export type { CurrentPauseRow };
export { currentPauseQueryKey };

export function useCurrentPause() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery(getCurrentPauseQueryOptions(userId));

  const bump = useCallback(() => {
    if (!userId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: currentPauseQueryKey(userId) });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`pause-instances-${userId}`)
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
    loaded: !userId || query.isFetched,
    current: query.data ?? null,
    refresh: bump,
  };
}
