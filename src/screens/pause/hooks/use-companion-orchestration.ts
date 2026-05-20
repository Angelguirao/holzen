import { useState } from 'react';
import { useCompanionInterventionBootstrap } from '@/screens/pause/hooks/use-companion-intervention-bootstrap';
import { useCompanionOrchestrateRetry } from '@/screens/pause/hooks/use-companion-orchestrate-retry';
import { useCompanionSlotOrchestrateActions } from '@/screens/pause/hooks/use-companion-slot-orchestrate-actions';
import { useCompanionSlotUiState } from '@/screens/pause/hooks/use-companion-slot-ui-state';

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

/**
 * Slot UI, intervention bootstrap, lazy-fetch/regenerate, and full orchestrate retry.
 */
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

  const interventionBootstrap = useCompanionInterventionBootstrap({
    pauseInstanceId,
    retryCount,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    autoSaveToLibrary: slotUi.autoSaveToLibrary,
    slotCommitters: slotUi.slotCommitters,
    fetchedSlotsRef: slotUi.fetchedSlotsRef,
    setCacheRelaxations: slotUi.setCacheRelaxations,
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
    setCacheIds: slotUi.setCacheIds,
    setCacheRelaxations: slotUi.setCacheRelaxations,
    slotCommitters: slotUi.slotCommitters,
    companionSlotLoadingSetters: slotUi.companionSlotLoadingSetters,
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
    setIntervention: interventionBootstrap.setIntervention,
    setInterventionError: interventionBootstrap.setInterventionError,
    clearInterventionFetchDedupe: interventionBootstrap.clearInterventionFetchDedupe,
    interventionSkippedRef: interventionBootstrap.interventionSkippedRef,
    pendingRetryConfirmRef: interventionBootstrap.pendingRetryConfirmRef,
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
    intervention: interventionBootstrap.intervention,
    interventionLoading: interventionBootstrap.interventionLoading,
    interventionError: interventionBootstrap.interventionError,
    retryOrchestrate,
    fetchCompanion: orchestrateActions.fetchCompanion,
    regenerateCompanion: orchestrateActions.regenerateCompanion,
    retryNudge: orchestrateActions.retryNudge,
    retrySignal: orchestrateActions.retrySignal,
    retryZoomOut: orchestrateActions.retryZoomOut,
    retryHistory: orchestrateActions.retryHistory,
  };
}
