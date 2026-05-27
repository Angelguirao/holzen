import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  applyCompanionOrchestrateRetryReset,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotRelaxations,
} from './pause-companion-orchestrate-io';

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
  setCacheRelaxations: Dispatch<SetStateAction<CompanionSlotRelaxations>>;
};

/** Manual "retry orchestrate" — clears slot UI and bumps retry generation. */
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
  setCacheRelaxations,
}: UseCompanionOrchestrateRetryParams) {
  const retryOrchestrate = useCallback(() => {
    applyCompanionOrchestrateRetryReset(
      {
        pauseInstanceId: pauseInstanceId ?? null,
      },
      {
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
        },
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
    setCacheRelaxations,
  ]);

  return { retryOrchestrate };
}
