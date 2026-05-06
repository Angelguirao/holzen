import { supabase } from '@/integrations/supabase/client';
import type { CompanionData } from '@/components/CompanionSection';
import { companionDataFromArtifacts } from '@/lib/pause-session-storage';

export interface PauseSessionSnapshot {
  id: string;
  reflectionMessage: string;
  context: string | null;
  mood: string | null;
  companions: CompanionData;
}

export function pauseSessionCompanionSnapshotQueryKey(pauseInstanceId: string) {
  return ['pause', 'companion-fullview', 'snapshot', pauseInstanceId] as const;
}

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
  if (!reflectionMessage) return null;

  return {
    id: pauseInstanceId,
    reflectionMessage,
    context,
    mood,
    companions: companionDataFromArtifacts(artifactRows),
  };
}
