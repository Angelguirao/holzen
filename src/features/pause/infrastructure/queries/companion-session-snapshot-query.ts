import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/components/CompanionSection';
import { companionDataFromArtifacts } from '@/features/pause/application/companion/companion-data-from-artifacts';
import { PAUSE_QUERY_PREFIX } from '@/features/pause/application/queries/pause-query-namespace';

export interface PauseSessionSnapshot {
  id: string;
  reflectionMessage: string;
  context: string | null;
  mood: string | null;
  companions: CompanionData;
}

export const PAUSE_COMPANION_FULLVIEW_QUERY_PREFIX = [...PAUSE_QUERY_PREFIX, 'companion-fullview'] as const;

export const PAUSE_SESSION_COMPANION_SNAPSHOT_QUERY_LEAF = 'snapshot' as const;

export const PAUSE_SESSION_COMPANION_SNAPSHOT_QUERY_PREFIX = [
  ...PAUSE_COMPANION_FULLVIEW_QUERY_PREFIX,
  PAUSE_SESSION_COMPANION_SNAPSHOT_QUERY_LEAF,
] as const;

export function pauseSessionCompanionSnapshotQueryKey(pauseInstanceId: string) {
  return [...PAUSE_SESSION_COMPANION_SNAPSHOT_QUERY_PREFIX, pauseInstanceId] as const;
}

export const PAUSE_SESSION_COMPANION_SNAPSHOT_DISABLED_INSTANCE_ID = 'none' as const;

/**
 * Shared loader used by the four full-view companion pages. Reads a
 * pause_instance row + its artifacts, returns an in-memory snapshot
 * shaped for the companion page hydration + CompanionSection.
 */
export async function loadPauseSessionSnapshot(
  pauseInstanceId: string,
): Promise<PauseSessionSnapshot | null> {
  const { data: inst, error } = await supabase
    .from('pause_instances' as never)
    .select('id, context_snapshot')
    .eq('id', pauseInstanceId)
    .maybeSingle();
  if (error || !inst) return null;

  const ctxSnap = ((inst as { context_snapshot: Record<string, unknown> | null }).context_snapshot ?? {}) as Record<string, unknown>;
  const context = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
  const mood = typeof ctxSnap.last_reported_mood === 'string' ? (ctxSnap.last_reported_mood as string) : null;

  const { data: artifacts } = await supabase
    .from('pause_ai_artifacts' as never)
    .select('kind, content')
    .eq('pause_instance_id', pauseInstanceId);
  const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;

  const reflectionArt = artifactRows.find((r) => r.kind === 'reflection_text');
  const reflectionMessage = typeof reflectionArt?.content?.message === 'string'
    ? (reflectionArt.content.message as string)
    : '';

  return {
    id: pauseInstanceId,
    reflectionMessage,
    context,
    mood,
    companions: companionDataFromArtifacts(artifactRows),
  };
}

export const PAUSE_SESSION_COMPANION_SNAPSHOT_NONE_QUERY_KEY = [
  ...PAUSE_SESSION_COMPANION_SNAPSHOT_QUERY_PREFIX,
  PAUSE_SESSION_COMPANION_SNAPSHOT_DISABLED_INSTANCE_ID,
] as const;

const COMPANION_SNAPSHOT_REFLECT_POLL_MS = 2_000;

export function getPauseSessionCompanionSnapshotQueryOptions(pauseInstanceId: string | undefined) {
  return {
    queryKey: pauseInstanceId
      ? pauseSessionCompanionSnapshotQueryKey(pauseInstanceId)
      : PAUSE_SESSION_COMPANION_SNAPSHOT_NONE_QUERY_KEY,
    queryFn: () => loadPauseSessionSnapshot(pauseInstanceId!),
    enabled: Boolean(pauseInstanceId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
    refetchInterval: (query: { state: { data?: PauseSessionSnapshot | null } }) => {
      const msg = query.state.data?.reflectionMessage?.trim() ?? '';
      return msg ? false : COMPANION_SNAPSHOT_REFLECT_POLL_MS;
    },
  } as const;
}
