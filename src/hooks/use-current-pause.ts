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
import { useAuth } from '@/hooks/use-auth';
import type { PauseState } from '@/lib/pause-state';

export interface CurrentPauseRow {
  id: string;
  user_id: string;
  state: PauseState;
  source: string;
  created_at: string;
  window_ends_at: string;
  engaged_at: string | null;
  context_snapshot: Record<string, unknown> | null;
}

export function currentPauseQueryKey(userId: string) {
  return ['pause', 'current-open', userId] as const;
}

async function fetchCurrentPause(userId: string): Promise<CurrentPauseRow | null> {
  const { data, error } = await supabase
    .from('v_pause_current' as never)
    .select('id, user_id, state, source, created_at, window_ends_at, engaged_at, context_snapshot')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  return data as unknown as CurrentPauseRow;
}

export function useCurrentPause() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: userId ? currentPauseQueryKey(userId) : ['pause', 'current-open', 'none'],
    queryFn: () => fetchCurrentPause(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

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
