import { supabase } from '@/integrations/supabase/client';
import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';
import {
  buildFetchedPauseInstanceFromFetch,
  type PauseInstanceContextSnapshotRow,
} from '@/features/pause/application/use-cases/session/fetched-instance-from-fetch';

export const PAUSE_SESSION_QUERY_PREFIX = ['pause-session'] as const;

export const PAUSE_SESSION_FETCHED_INSTANCE_QUERY_LEAF = 'fetched-instance' as const;

export const PAUSE_SESSION_FETCHED_INSTANCE_QUERY_PREFIX = [
  ...PAUSE_SESSION_QUERY_PREFIX,
  PAUSE_SESSION_FETCHED_INSTANCE_QUERY_LEAF,
] as const;

export const PAUSE_SESSION_FETCHED_INSTANCE_DISABLED_INSTANCE_ID = 'none' as const;

export const PAUSE_SESSION_FETCHED_INSTANCE_NONE_QUERY_KEY = [
  ...PAUSE_SESSION_FETCHED_INSTANCE_QUERY_PREFIX,
  PAUSE_SESSION_FETCHED_INSTANCE_DISABLED_INSTANCE_ID,
] as const;

export function pauseSessionFetchedInstanceQueryKey(pauseInstanceId: string) {
  return [...PAUSE_SESSION_FETCHED_INSTANCE_QUERY_PREFIX, pauseInstanceId] as const;
}

export async function fetchPauseInstanceForSession(pauseInstanceId: string): Promise<FetchedPauseInstance> {
  const { data: inst, error: instError } = await supabase
    .from('pause_instances' as never)
    .select('id, context_snapshot, state, engaged_at')
    .eq('id', pauseInstanceId)
    .maybeSingle();
  if (instError || !inst) {
    throw new Error(instError?.message || 'pause_instance_missing');
  }
  const { data: artifacts, error: artifactsError } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('kind, content')
    .eq('pause_instance_id', pauseInstanceId);
  if (artifactsError) {
    throw new Error(artifactsError.message || 'pause_artifacts_failed');
  }
  const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;
  return buildFetchedPauseInstanceFromFetch(
    pauseInstanceId,
    inst as PauseInstanceContextSnapshotRow,
    artifactRows,
  );
}

export function getPauseSessionFetchedInstanceQueryOptions(fetchPauseInstanceId: string | null) {
  return {
    queryKey: fetchPauseInstanceId
      ? pauseSessionFetchedInstanceQueryKey(fetchPauseInstanceId)
      : PAUSE_SESSION_FETCHED_INSTANCE_NONE_QUERY_KEY,
    queryFn: () => fetchPauseInstanceForSession(fetchPauseInstanceId!),
    enabled: Boolean(fetchPauseInstanceId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
