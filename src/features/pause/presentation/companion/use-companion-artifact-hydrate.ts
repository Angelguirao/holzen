import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { hydrateCompanionSlotsFromArtifactCache } from '@/features/pause/application/use-cases/ritual/frame/hydrate-companion-slots-from-artifact-cache';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
import type { CompanionSlotCommitters } from './pause-companion-orchestrate-io';

export type UseCompanionArtifactHydrateParams = {
  pauseInstanceId?: string | null;
  fetchedSlotsRef: MutableRefObject<Set<string>>;
  slotCommitters: CompanionSlotCommitters;
};

/**
 * Load persisted `pause_ai_artifacts` into slot UI before lazy-fetch / quota checks.
 * Exposes `whenArtifactHydrateReady` so full-view routes and `fetchCompanion` wait
 * for hydrate instead of treating an empty in-memory slot as "needs generation".
 */
export function useCompanionArtifactHydrate({
  pauseInstanceId,
  fetchedSlotsRef,
  slotCommitters,
}: UseCompanionArtifactHydrateParams) {
  const hydrateReadyRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const id = pauseInstanceId;
    if (!id) {
      hydrateReadyRef.current = Promise.resolve();
      return;
    }

    let cancelled = false;
    hydrateReadyRef.current = (async () => {
      try {
        const cached = await fetchParsedPauseArtifactCache(id);
        if (cancelled) return;
        hydrateCompanionSlotsFromArtifactCache({
          cached,
          fetchedSlots: fetchedSlotsRef.current,
          committers: slotCommitters,
        });
      } catch {
        // Lazy-fetch may still run; do not block the strip on read errors.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pauseInstanceId, fetchedSlotsRef, slotCommitters]);

  const whenArtifactHydrateReady = useCallback(
    () => hydrateReadyRef.current,
    [],
  );

  return { whenArtifactHydrateReady };
}
