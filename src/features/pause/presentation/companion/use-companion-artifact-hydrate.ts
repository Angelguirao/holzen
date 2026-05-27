import { useEffect, type MutableRefObject } from 'react';
import { hydrateCompanionSlotsFromArtifactCache } from '@/features/pause/application/use-cases/ritual/frame/hydrate-companion-slots-from-artifact-cache';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
import type { CompanionSlotCommitters } from './pause-companion-orchestrate-io';

export type UseCompanionArtifactHydrateParams = {
  pauseInstanceId?: string | null;
  fetchedSlotsRef: MutableRefObject<Set<string>>;
  slotCommitters: CompanionSlotCommitters;
};

/** Load persisted `pause_ai_artifacts` into slot UI so expand does not re-bill lazy fetch. */
export function useCompanionArtifactHydrate({
  pauseInstanceId,
  fetchedSlotsRef,
  slotCommitters,
}: UseCompanionArtifactHydrateParams) {
  useEffect(() => {
    const id = pauseInstanceId;
    if (!id) return;

    let cancelled = false;
    void (async () => {
      try {
        const cached = await fetchParsedPauseArtifactCache(id);
        if (cancelled) return;
        hydrateCompanionSlotsFromArtifactCache({
          cached,
          fetchedSlots: fetchedSlotsRef.current,
          committers: slotCommitters,
        });
      } catch {
        // Expand path may still lazy-fetch; avoid blocking the strip on read errors.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, fetchedSlotsRef, slotCommitters]);
}
