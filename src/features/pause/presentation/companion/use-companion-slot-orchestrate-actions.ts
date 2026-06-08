import { useCallback, useRef } from 'react';
import type {
  CompanionSlotCacheIds,
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from './pause-companion-orchestrate-io';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { CompanionSlotTransitionStarters } from './pause-companion-orchestrate-io';
import { useCompanionSlotOrchestrateFailurePorts } from './use-companion-slot-orchestrate-failure-ports';
import { useCompanionSlotRunOrchestrate } from './use-companion-slot-run-orchestrate';

export interface UseCompanionSlotOrchestrateActionsParams {
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
  language: string;
  canAccessCompanion: () => boolean;
  applyOptimisticDecrement: (bucket: 'companion') => void;
  refreshSubscription: () => void | Promise<void>;
  toast: (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
  requirePro: (feature: 'companions') => boolean;
  startCheckout: () => void;
  fetchedSlotsRef: React.MutableRefObject<Set<string>>;
  whenArtifactHydrateReady: () => Promise<void>;
  setCacheIds: React.Dispatch<React.SetStateAction<CompanionSlotCacheIds>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
  slotCommitters: CompanionSlotCommitters;
  companionSlotTransitionStarters: CompanionSlotTransitionStarters;
  companionSlotErrorSetters: {
    setSignalError: (v: boolean) => void;
    setGroundingError: (v: boolean) => void;
    setHistoryError: (v: boolean) => void;
    setZoomOutError: (v: boolean) => void;
  };
}

/**
 * Lazy-fetch and regenerate companion slots via `companion-orchestrate` edge (`invokeEdge` + x-cid).
 */
export function useCompanionSlotOrchestrateActions(params: UseCompanionSlotOrchestrateActionsParams) {
  const {
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    canAccessCompanion,
    applyOptimisticDecrement: _applyOptimisticDecrement,
    refreshSubscription,
    toast,
    requirePro,
    startCheckout,
    fetchedSlotsRef,
    whenArtifactHydrateReady,
    setCacheIds,
    setCacheRelaxations,
    slotCommitters,
    companionSlotTransitionStarters,
    companionSlotErrorSetters,
  } = params;

  const lazyFetchInFlightRef = useRef<Set<string>>(new Set());

  const failureUiPorts = useCompanionSlotOrchestrateFailurePorts({
    fetchedSlotsRef,
    requirePro,
    startCheckout,
    toast,
  });

  const { runSlotOrchestrate } = useCompanionSlotRunOrchestrate({
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    failureUiPorts,
    toast,
    refreshSubscription,
    setCacheIds,
    setCacheRelaxations,
    slotCommitters,
    companionSlotTransitionStarters,
    companionSlotErrorSetters,
  });

  const fetchCompanion = useCallback(
    async (slot: RegenerateCompanionSlot) => {
      if (!pauseInstanceId) return;
      await whenArtifactHydrateReady();
      if (fetchedSlotsRef.current.has(slot)) return;
      if (lazyFetchInFlightRef.current.has(slot)) return;
      if (!canAccessCompanion()) return;

      lazyFetchInFlightRef.current.add(slot);
      try {
        await runSlotOrchestrate(slot, 'lazy_fetch');
      } finally {
        lazyFetchInFlightRef.current.delete(slot);
      }
    },
    [
      pauseInstanceId,
      whenArtifactHydrateReady,
      canAccessCompanion,
      runSlotOrchestrate,
      fetchedSlotsRef,
    ],
  );

  const regenerateCompanion = useCallback(
    async (slot: RegenerateCompanionSlot) => {
      if (!pauseInstanceId) return;
      if (!canAccessCompanion()) return;
      await runSlotOrchestrate(slot, 'regenerate');
    },
    [pauseInstanceId, canAccessCompanion, runSlotOrchestrate],
  );

  const retrySlot = useCallback(
    (slot: RegenerateCompanionSlot) => {
      fetchedSlotsRef.current.delete(slot);
      void fetchCompanion(slot);
    },
    [fetchCompanion, fetchedSlotsRef],
  );

  const retryGrounding = useCallback(() => retrySlot('grounding'), [retrySlot]);
  const retrySignal = useCallback(() => retrySlot('signal'), [retrySlot]);
  const retryZoomOut = useCallback(() => retrySlot('zoomOut'), [retrySlot]);
  const retryHistory = useCallback(() => retrySlot('history'), [retrySlot]);

  return {
    fetchCompanion,
    regenerateCompanion,
    retryGrounding,
    retrySignal,
    retryZoomOut,
    retryHistory,
  };
}
