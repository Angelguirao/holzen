import { supabase } from '@/integrations/supabase/client';
import type { RelatedBiasesRow } from '@/components/companion/related-biases-util';

export const RELATED_BIASES_GROUND_NUDGE_NONE_QUERY_KEY = ['related-biases-ground-nudge', 'none'] as const;

export function relatedBiasesGroundNudgeQueryKey(userId: string) {
  return ['related-biases-ground-nudge', userId] as const;
}

export async function fetchGroundNudgeArtifactsLast30d(userId: string): Promise<RelatedBiasesRow[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('pause_instance_id, created_at, content')
    .eq('user_id', userId)
    .eq('kind', 'ground_nudge')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error || !data) return [];
  return data as unknown as RelatedBiasesRow[];
}

export function getRelatedBiasesGroundNudgeQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? relatedBiasesGroundNudgeQueryKey(userId) : RELATED_BIASES_GROUND_NUDGE_NONE_QUERY_KEY,
    queryFn: () => fetchGroundNudgeArtifactsLast30d(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
