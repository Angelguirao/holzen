import { supabase } from '@/integrations/supabase/client';
import type { RelatedBiasesRow } from '@/features/pause/application/use-cases/companion/related-biases';

export const RELATED_BIASES_GROUND_NUDGE_QUERY_PREFIX = ['related-biases-ground-nudge'] as const;

export const RELATED_BIASES_GROUND_NUDGE_DISABLED_USER_ID = 'none' as const;

export const RELATED_BIASES_GROUND_NUDGE_NONE_QUERY_KEY = [
  ...RELATED_BIASES_GROUND_NUDGE_QUERY_PREFIX,
  RELATED_BIASES_GROUND_NUDGE_DISABLED_USER_ID,
] as const;

export function relatedBiasesGroundNudgeQueryKey(userId: string) {
  return [...RELATED_BIASES_GROUND_NUDGE_QUERY_PREFIX, userId] as const;
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
