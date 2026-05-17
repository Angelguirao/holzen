import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import { companionDataFromArtifacts } from '@/lib/pause-session-storage';
import type { PauseState } from '@/lib/pause-state';

/**
 * Pure mapping from Supabase `pause_instances` + `pause_ai_artifacts` reads into `FetchedPauseInstance`
 * for id-only `/pause` hydration.
 *
 * **Caller:** `src/hooks/use-pause-session-fetch.ts`. **Docs:** `docs/systems/pause-system.md` section 7.2 and
 * section 10 (shell hydration row lists this file).
 */

/** `pause_instances` row shape used when hydrating `/pause` from id only. */
export type PauseInstanceContextSnapshotRow = {
  context_snapshot: Record<string, unknown> | null;
  state?: PauseState | null;
  engaged_at?: string | null;
};

export type PauseAiArtifactKindRow = {
  kind: string;
  content: Record<string, unknown>;
};

/** Folds `context_snapshot` + artifact rows (reflection + companions) into `FetchedPauseInstance`. */
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
    db_state: inst.state ?? null,
    engaged_at: inst.engaged_at ?? null,
  };
}
