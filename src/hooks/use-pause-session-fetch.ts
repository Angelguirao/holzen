import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import {
  buildFetchedPauseInstanceFromFetch,
  type PauseInstanceContextSnapshotRow,
} from '@/lib/pause-session-fetched-instance';

export function pauseSessionFetchedInstanceQueryKey(pauseInstanceId: string) {
  return ['pause-session', 'fetched-instance', pauseInstanceId] as const;
}

async function fetchPauseInstanceForSession(pauseInstanceId: string): Promise<FetchedPauseInstance> {
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

/**
 * Loads `pause_instances` + `pause_ai_artifacts` when `/pause` opens with id-only navigation
 * (hydration `status === 'fetch'` from `computePauseSessionHydration`). Row shaping:
 * `src/lib/pause-session-fetched-instance.ts`.
 *
 * **Caller:** `src/hooks/use-pause-session-shell.ts`. **Contract:** `docs/systems/pause-system.md`
 * section 7.2; **code map:** same doc, section 10.
 */
export function usePauseSessionFetch(fetchPauseInstanceId: string | null): {
  fetchedInstance: FetchedPauseInstance | null;
  fetchFailed: boolean;
} {
  const query = useQuery({
    queryKey: fetchPauseInstanceId
      ? pauseSessionFetchedInstanceQueryKey(fetchPauseInstanceId)
      : ['pause-session', 'fetched-instance', 'none'],
    queryFn: () => fetchPauseInstanceForSession(fetchPauseInstanceId!),
    enabled: Boolean(fetchPauseInstanceId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const fetchedInstance =
    fetchPauseInstanceId && query.isSuccess && query.data ? query.data : null;
  const fetchFailed = Boolean(fetchPauseInstanceId && query.isError);

  return { fetchedInstance, fetchFailed };
}
