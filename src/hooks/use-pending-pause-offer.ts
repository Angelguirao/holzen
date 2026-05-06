import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface PendingPauseOfferRow {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  preview_message: string | null;
}

export function pendingPauseOfferQueryKey(userId: string) {
  return ['pause', 'pending-offer', userId] as const;
}

async function fetchPendingPauseOffer(userId: string): Promise<PendingPauseOfferRow | null> {
  const { data, error } = await supabase
    .from('pause_instances' as never)
    .select('id, created_at, context_snapshot, metadata')
    .eq('user_id', userId)
    .eq('state', 'pending' as never)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    id: string;
    created_at: string;
    context_snapshot: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
  };

  const { data: art } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('content')
    .eq('pause_instance_id', row.id)
    .eq('kind', 'reflection_text')
    .maybeSingle();

  const content = art as { content: Record<string, unknown> } | null;
  const preview =
    content?.content && typeof content.content.message === 'string'
      ? (content.content.message as string)
      : null;

  return {
    id: row.id,
    created_at: row.created_at,
    context_snapshot: row.context_snapshot,
    metadata: row.metadata,
    preview_message: preview,
  };
}

/**
 * The single `state = 'pending'` pause row for the user (if any), plus a
 * short reflection preview when artifacts exist. Subscribes to
 * `pause_instances` so cron-created offers surface without refresh.
 */
export function usePendingPauseOffer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: userId ? pendingPauseOfferQueryKey(userId) : ['pause', 'pending-offer', 'none'],
    queryFn: () => fetchPendingPauseOffer(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

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
