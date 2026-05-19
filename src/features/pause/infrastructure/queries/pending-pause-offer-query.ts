import { supabase } from '@/integrations/supabase/client';
import {
  PENDING_PAUSE_OFFER_NONE_QUERY_KEY,
  pendingPauseOfferQueryKey,
} from '@/features/pause/application/queries/pending-pause-offer-keys';

export {
  PENDING_PAUSE_OFFER_DISABLED_USER_ID,
  PENDING_PAUSE_OFFER_NONE_QUERY_KEY,
  PENDING_PAUSE_OFFER_QUERY_LEAF,
  PENDING_PAUSE_OFFER_QUERY_PREFIX,
  pendingPauseOfferQueryKey,
} from '@/features/pause/application/queries/pending-pause-offer-keys';

export interface PendingPauseOfferRow {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  preview_message: string | null;
}

export async function fetchPendingPauseOffer(userId: string): Promise<PendingPauseOfferRow | null> {
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

  const ctxSnap = row.context_snapshot ?? {};
  const preview =
    typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;

  return {
    id: row.id,
    created_at: row.created_at,
    context_snapshot: row.context_snapshot,
    metadata: row.metadata,
    preview_message: preview,
  };
}

export function getPendingPauseOfferQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? pendingPauseOfferQueryKey(userId) : PENDING_PAUSE_OFFER_NONE_QUERY_KEY,
    queryFn: () => fetchPendingPauseOffer(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  } as const;
}
