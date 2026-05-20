import { useCallback } from 'react';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import type {
  CompanionSlotCacheIds,
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from '@/features/pause/public';
import { useCompanionSlotOrchestratePorts } from '@/features/pause/public-hooks';
import { useCompanionSlotOrchestrateFailurePorts } from '@/features/pause/public-hooks';
import { useCompanionSlotRunOrchestrate } from '@/features/pause/public-hooks';

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
  setCacheIds: React.Dispatch<React.SetStateAction<CompanionSlotCacheIds>>;
  setCacheRelaxations: React.Dispatch<React.SetStateAction<CompanionSlotRelaxations>>;
  slotCommitters: CompanionSlotCommitters;
  companionSlotLoadingSetters: {
    setSignalLoading: (v: boolean) => void;
    setNudgeLoading: (v: boolean) => void;
    setHistoryLoading: (v: boolean) => void;
    setZoomOutLoading: (v: boolean) => void;
  };
  companionSlotErrorSetters: {
    setSignalError: (v: boolean) => void;
    setNudgeError: (v: boolean) => void;
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
    applyOptimisticDecrement,
    refreshSubscription,
    toast,
    requirePro,
    startCheckout,
    fetchedSlotsRef,
    setCacheIds,
    setCacheRelaxations,
    slotCommitters,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
  } = params;

  const slotOrchestratePorts = useCompanionSlotOrchestratePorts();
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
    slotOrchestratePorts,
    failureUiPorts,
    toast,
    refreshSubscription,
    setCacheIds,
    setCacheRelaxations,
    slotCommitters,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
  });

  const fetchCompanion = useCallback(
    async (slot: RegenerateCompanionSlot) => {
      if (!pauseInstanceId) return;
      if (fetchedSlotsRef.current.has(slot)) return;
      if (!canAccessCompanion()) return;

      fetchedSlotsRef.current.add(slot);
      applyOptimisticDecrement('companion');
      await runSlotOrchestrate(slot, 'lazy_fetch');
    },
    [pauseInstanceId, canAccessCompanion, applyOptimisticDecrement, runSlotOrchestrate, fetchedSlotsRef],
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

  const retryNudge = useCallback(() => retrySlot('grounding'), [retrySlot]);
  const retrySignal = useCallback(() => retrySlot('signal'), [retrySlot]);
  const retryZoomOut = useCallback(() => retrySlot('zoomOut'), [retrySlot]);
  const retryHistory = useCallback(() => retrySlot('history'), [retrySlot]);

  return {
    fetchCompanion,
    regenerateCompanion,
    retryNudge,
    retrySignal,
    retryZoomOut,
    retryHistory,
  };
}
