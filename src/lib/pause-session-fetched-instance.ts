import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import { companionDataFromArtifacts } from '@/lib/pause-session-storage';

/** `pause_instances` row shape used when hydrating `/pause` from id only. */
export type PauseInstanceContextSnapshotRow = {
  context_snapshot: Record<string, unknown> | null;
};

export type PauseAiArtifactKindRow = {
  kind: string;
  content: Record<string, unknown>;
};

/**
 * Pure fold of `pause_instances.context_snapshot` + `pause_ai_artifact` rows into
 * {@link FetchedPauseInstance} for the Archive/Bell deep-link fetch path in `PauseSession`.
 */
export function buildFetchedPauseInstanceFromFetch(
  pauseInstanceId: string,
  inst: PauseInstanceContextSnapshotRow,
  artifactRows: PauseAiArtifactKindRow[],
): FetchedPauseInstance {
  const companionData = companionDataFromArtifacts(artifactRows);
  const reflectionArt = artifactRows.find((a) => a.kind === 'reflection_text');
  const msg =
    typeof reflectionArt?.content?.message === 'string' ? (reflectionArt.content.message as string) : '';
  const ctxSnap = inst.context_snapshot ?? {};
  const ctx = typeof ctxSnap.context_text === 'string' ? (ctxSnap.context_text as string) : null;
  return {
    id: pauseInstanceId,
    reflection_message: msg,
    context: ctx,
    haiku: companionData.haiku,
    grounding_title: companionData.groundingTitle,
    grounding_body: companionData.groundingBody,
  };
}
