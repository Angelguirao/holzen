import { useEffect } from 'react';
import { PAUSE_FEATURED_INTERVENTION_ENABLED } from '@/legacy/pause-featured-intervention/domain/pause-featured-intervention';
import type { InterventionState } from '@/legacy/pause-featured-intervention/domain/intervention-types';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
import type { CompanionOrchestrateSessionContext } from '@/features/pause/application/use-cases/ritual/frame/build-companion-orchestrate-body';
import type {
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import { invokeFeaturedInterventionOrchestrate } from '@/legacy/pause-featured-intervention/infrastructure/invoke-featured-intervention';
import { runCompanionInterventionBootstrap } from '@/legacy/pause-featured-intervention/application/run-companion-intervention-bootstrap';

export type UseCompanionInterventionFetchParams = {
  pauseInstanceId?: string | null;
  retryCount: number;
  interventionFetchKeyRef: React.MutableRefObject<string | null>;
  interventionSkippedRef: React.MutableRefObject<boolean>;
  startInterventionTransition: React.TransitionStartFunction;
  setInterventionError: (error: boolean) => void;
  setIntervention: (value: InterventionState) => void;
  loadOrchestrateSession: () => Promise<CompanionOrchestrateSessionContext | null>;
  slotCommitters: CompanionSlotCommitters;
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
};

export function useCompanionInterventionFetch(params: UseCompanionInterventionFetchParams) {
  const {
    pauseInstanceId,
    retryCount,
    interventionFetchKeyRef,
    interventionSkippedRef,
    startInterventionTransition,
    setInterventionError,
    setIntervention,
    loadOrchestrateSession,
    slotCommitters,
    fetchedSlotsRef,
    setCacheRelaxations,
  } = params;

  useEffect(() => {
    if (!PAUSE_FEATURED_INTERVENTION_ENABLED) return;
    if (!pauseInstanceId) return;

    const key = `${pauseInstanceId}:${retryCount}`;
    if (interventionFetchKeyRef.current === key) return;
    interventionFetchKeyRef.current = key;

    let cancelled = false;

    startInterventionTransition(async () => {
      setInterventionError(false);

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
            invokeIntervention: invokeFeaturedInterventionOrchestrate,
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
      }
    });

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
    startInterventionTransition,
  ]);
}
