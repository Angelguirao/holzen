import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { applyCompanionOrchestrateRetryReset } from '@/features/pause/application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
import { resetInterventionIdempotency } from '@/features/pause/application/use-cases/ritual/frame/intervention-idempotency';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotRelaxations,
} from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';

export type UseCompanionOrchestrateRetryParams = {
  pauseInstanceId?: string | null;
  setRetryCount: Dispatch<SetStateAction<number>>;
  fetchedSlotsRef: MutableRefObject<Set<string>>;
  setSignal: (v: null) => void;
  setSignalError: (v: boolean) => void;
  setNudge: (v: null) => void;
  setNudgeError: (v: boolean) => void;
  setZoomOut: (v: null) => void;
  setZoomOutError: (v: boolean) => void;
  setHistoryInsight: (v: null) => void;
  setHistoryError: (v: boolean) => void;
  setIntervention: (v: null) => void;
  setInterventionError: (v: boolean) => void;
  clearInterventionFetchDedupe: () => void;
  interventionSkippedRef: MutableRefObject<boolean>;
  pendingRetryConfirmRef: MutableRefObject<string | null>;
  setCacheRelaxations: Dispatch<SetStateAction<CompanionSlotRelaxations>>;
};

/** Manual "retry orchestrate" — resets slots + intervention idempotency and bumps retry generation. */
export function useCompanionOrchestrateRetry({
  pauseInstanceId,
  setRetryCount,
  fetchedSlotsRef,
  setSignal,
  setSignalError,
  setNudge,
  setNudgeError,
  setZoomOut,
  setZoomOutError,
  setHistoryInsight,
  setHistoryError,
  setIntervention,
  setInterventionError,
  clearInterventionFetchDedupe,
  interventionSkippedRef,
  pendingRetryConfirmRef,
  setCacheRelaxations,
}: UseCompanionOrchestrateRetryParams) {
  const retryOrchestrate = useCallback(() => {
    applyCompanionOrchestrateRetryReset(
      {
        pauseInstanceId: pauseInstanceId ?? null,
        interventionSkipped: interventionSkippedRef.current,
      },
      {
        resetInterventionIdempotency,
        queuePendingRetryConfirm: (id) => {
          pendingRetryConfirmRef.current = id;
        },
        resetFetchedSlots: () => {
          fetchedSlotsRef.current = new Set();
        },
        clearSlotContent: () => {
          setSignal(null);
          setSignalError(false);
          setNudge(null);
          setNudgeError(false);
          setZoomOut(null);
          setZoomOutError(false);
          setHistoryInsight(null);
          setHistoryError(false);
          setIntervention(null);
          setInterventionError(false);
        },
        clearInterventionFetchDedupe,
        resetRelaxations: () => setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS),
      },
    );
    setRetryCount((c) => c + 1);
  }, [
    pauseInstanceId,
    setRetryCount,
    fetchedSlotsRef,
    setSignal,
    setSignalError,
    setNudge,
    setNudgeError,
    setZoomOut,
    setZoomOutError,
    setHistoryInsight,
    setHistoryError,
    setIntervention,
    setInterventionError,
    clearInterventionFetchDedupe,
    interventionSkippedRef,
    pendingRetryConfirmRef,
    setCacheRelaxations,
  ]);

  return { retryOrchestrate };
}
