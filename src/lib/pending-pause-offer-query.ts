import { supabase } from '@/integrations/supabase/client';
import { PAUSE_QUERY_PREFIX } from '@/lib/pause-query-namespace';

export interface PendingPauseOfferRow {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  preview_message: string | null;
}

export const PENDING_PAUSE_OFFER_QUERY_LEAF = 'pending-offer' as const;

export const PENDING_PAUSE_OFFER_QUERY_PREFIX = [
  ...PAUSE_QUERY_PREFIX,
  PENDING_PAUSE_OFFER_QUERY_LEAF,
] as const;

export const PENDING_PAUSE_OFFER_DISABLED_USER_ID = 'none' as const;

export const PENDING_PAUSE_OFFER_NONE_QUERY_KEY = [
  ...PENDING_PAUSE_OFFER_QUERY_PREFIX,
  PENDING_PAUSE_OFFER_DISABLED_USER_ID,
] as const;

export function pendingPauseOfferQueryKey(userId: string) {
  return [...PENDING_PAUSE_OFFER_QUERY_PREFIX, userId] as const;
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
