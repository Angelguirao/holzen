import { useState } from 'react';
import { useCompanionArtifactHydrate } from './use-companion-artifact-hydrate';
import { useCompanionOrchestrateRetry } from './use-companion-orchestrate-retry';
import { useCompanionSlotOrchestrateActions } from './use-companion-slot-orchestrate-actions';
import { useCompanionSlotUiState } from './use-companion-slot-ui-state';

export type UseCompanionOrchestrationParams = {
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
};

/** Slot UI, lazy-fetch/regenerate, and full orchestrate retry (featured intervention lives in legacy). */
export function useCompanionOrchestration({
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
}: UseCompanionOrchestrationParams) {
  const [retryCount, setRetryCount] = useState(0);

  const slotUi = useCompanionSlotUiState(pauseInstanceId);

  const { whenArtifactHydrateReady } = useCompanionArtifactHydrate({
    pauseInstanceId,
    fetchedSlotsRef: slotUi.fetchedSlotsRef,
    slotCommitters: slotUi.slotCommitters,
  });

  const orchestrateActions = useCompanionSlotOrchestrateActions({
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
    fetchedSlotsRef: slotUi.fetchedSlotsRef,
    whenArtifactHydrateReady,
    setCacheIds: slotUi.setCacheIds,
    setCacheRelaxations: slotUi.setCacheRelaxations,
    slotCommitters: slotUi.slotCommitters,
    companionSlotTransitionStarters: slotUi.companionSlotTransitionStarters,
    companionSlotErrorSetters: slotUi.companionSlotErrorSetters,
  });

  const { retryOrchestrate } = useCompanionOrchestrateRetry({
    pauseInstanceId,
    setRetryCount,
    fetchedSlotsRef: slotUi.fetchedSlotsRef,
    setSignal: slotUi.setSignal,
    setSignalError: slotUi.setSignalError,
    setNudge: slotUi.setNudge,
    setNudgeError: slotUi.setNudgeError,
    setZoomOut: slotUi.setZoomOut,
    setZoomOutError: slotUi.setZoomOutError,
    setHistoryInsight: slotUi.setHistoryInsight,
    setHistoryError: slotUi.setHistoryError,
    setCacheRelaxations: slotUi.setCacheRelaxations,
  });

  return {
    cacheIds: slotUi.cacheIds,
    cacheRelaxations: slotUi.cacheRelaxations,
    nudge: slotUi.nudge,
    nudgeLoading: slotUi.nudgeLoading,
    nudgeError: slotUi.nudgeError,
    signal: slotUi.signal,
    signalLoading: slotUi.signalLoading,
    signalError: slotUi.signalError,
    zoomOut: slotUi.zoomOut,
    zoomOutLoading: slotUi.zoomOutLoading,
    zoomOutError: slotUi.zoomOutError,
    historyInsight: slotUi.historyInsight,
    historyLoading: slotUi.historyLoading,
    historyError: slotUi.historyError,
    retryOrchestrate,
    fetchCompanion: orchestrateActions.fetchCompanion,
    regenerateCompanion: orchestrateActions.regenerateCompanion,
    retryNudge: orchestrateActions.retryNudge,
    retrySignal: orchestrateActions.retrySignal,
    retryZoomOut: orchestrateActions.retryZoomOut,
    retryHistory: orchestrateActions.retryHistory,
    whenArtifactHydrateReady,
  };
}
