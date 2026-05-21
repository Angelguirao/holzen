import { useEffect } from 'react';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import { runCompanionInterventionBootstrap } from '@/features/pause/application/use-cases/ritual/frame/run-companion-intervention-bootstrap';
import type {
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import type { InterventionState } from '@/features/pause/domain/companion-orchestrate';
import { fetchParsedPauseArtifactCache, supabaseCompanionOrchestrator } from '@/features/pause/public-queries';

export type UseCompanionInterventionFetchParams = {
  pauseInstanceId?: string | null;
  retryCount: number;
  interventionFetchKeyRef: React.MutableRefObject<string | null>;
  interventionSkippedRef: React.MutableRefObject<boolean>;
  setInterventionLoading: (loading: boolean) => void;
  setInterventionError: (error: boolean) => void;
  setIntervention: (value: InterventionState) => void;
  loadOrchestrateSession: () => Promise<CompanionOrchestrateSessionContext | null>;
  slotCommitters: CompanionSlotCommitters;
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
};

/** Fetches intervention + companion cache once per pause instance / retry generation. */
export function useCompanionInterventionFetch({
  pauseInstanceId,
  retryCount,
  interventionFetchKeyRef,
  interventionSkippedRef,
  setInterventionLoading,
  setInterventionError,
  setIntervention,
  loadOrchestrateSession,
  slotCommitters,
  fetchedSlotsRef,
  setCacheRelaxations,
}: UseCompanionInterventionFetchParams) {
  useEffect(() => {
    if (!pauseInstanceId) return;

    const key = `${pauseInstanceId}:${retryCount}`;
    if (interventionFetchKeyRef.current === key) return;
    interventionFetchKeyRef.current = key;

    let cancelled = false;
    setInterventionLoading(true);
    setInterventionError(false);

    (async () => {
      try {
        const result = await runCompanionInterventionBootstrap(
          {
            pauseInstanceId,
            fetchedSlots: fetchedSlotsRef.current,
            slotCommitters,
            setCacheRelaxations,
            setIntervention,
          },
          {
            fetchArtifactCache: fetchParsedPauseArtifactCache,
            loadOrchestrateSession,
            invokeIntervention: supabaseCompanionOrchestrator.invokeIntervention,
          },
        );

        if (cancelled) return;

        if (result.status === 'skipped_idempotency') {
          interventionSkippedRef.current = true;
        }
        if (result.status === 'error') {
          setInterventionError(true);
        }
      } catch (e) {
        console.error('[useCompanionInterventionFetch] intervention fetch failed', e);
        if (!cancelled) setInterventionError(true);
      } finally {
        if (!cancelled) setInterventionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pauseInstanceId,
    retryCount,
    loadOrchestrateSession,
    slotCommitters,
    fetchedSlotsRef,
    setCacheRelaxations,
    interventionFetchKeyRef,
    interventionSkippedRef,
    setIntervention,
    setInterventionError,
    setInterventionLoading,
  ]);
}
