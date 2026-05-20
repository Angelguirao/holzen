import { useState } from 'react';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useCompanionLibraryFavorites } from '@/screens/pause/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import { useCompanionAccess } from '@/screens/pause/hooks/use-companion-access';
import { useCompanionOrchestrateRetry } from '@/screens/pause/hooks/use-companion-orchestrate-retry';
import { useCompanionUiCompletion } from '@/screens/pause/hooks/use-companion-ui-completion';
import { useCompanionInterventionBootstrap } from '@/screens/pause/hooks/use-companion-intervention-bootstrap';
import { useCompanionSlotUiState } from '@/screens/pause/hooks/use-companion-slot-ui-state';
import { useCompanionSlotOrchestrateActions } from '@/screens/pause/hooks/use-companion-slot-orchestrate-actions';
import { useToast } from '@/components/ui/use-toast';

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/features/pause/public';

interface UseCompanionDataParams {
  companions: CompanionData;
  prefs: CompanionPrefs;
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
  severityNumber?: number;
}

export function useCompanionData({
  companions: _companions,
  prefs: _prefs,
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
  severityNumber,
}: UseCompanionDataParams) {
  const { language } = useHolzen();
  const { toast } = useToast();
  const { favorites, toggleCompanionFavorite } = useCompanionLibraryFavorites(pauseInstanceId);
  const {
    canAccessCompanion,
    applyOptimisticDecrement,
    refreshSubscription,
    requirePro,
    startCheckout,
  } = useCompanionAccess();
  const { completion, markCompleted } = useCompanionUiCompletion(pauseInstanceId);

  const [retryCount, setRetryCount] = useState(0);

  const {
    cacheIds,
    cacheRelaxations,
    setCacheIds,
    setCacheRelaxations,
    nudge,
    nudgeLoading,
    nudgeError,
    signal,
    signalLoading,
    signalError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    historyInsight,
    historyLoading,
    historyError,
    setNudge,
    setNudgeError,
    setSignal,
    setSignalError,
    setZoomOut,
    setZoomOutError,
    setHistoryInsight,
    setHistoryError,
    fetchedSlotsRef,
    autoSaveToLibrary,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
    slotCommitters,
  } = useCompanionSlotUiState(pauseInstanceId);

  const {
    intervention,
    interventionLoading,
    interventionError,
    setIntervention,
    setInterventionError,
    interventionSkippedRef,
    pendingRetryConfirmRef,
    clearInterventionFetchDedupe,
  } = useCompanionInterventionBootstrap({
    pauseInstanceId,
    retryCount,
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    autoSaveToLibrary,
    slotCommitters,
    fetchedSlotsRef,
    setCacheRelaxations,
  });

  const {
    fetchCompanion,
    regenerateCompanion,
    retryNudge,
    retrySignal,
    retryZoomOut,
    retryHistory,
  } = useCompanionSlotOrchestrateActions({
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
  });

  const { retryOrchestrate } = useCompanionOrchestrateRetry({
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
  });

  return {
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    cacheIds,
    cacheRelaxations,
    nudge,
    nudgeLoading,
    nudgeError,
    retryNudge,
    signal,
    signalLoading,
    signalError,
    retrySignal,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    retryZoomOut,
    historyInsight,
    historyLoading,
    historyError,
    retryHistory,
    intervention,
    interventionLoading,
    interventionError,
    retryOrchestrate,
    regenerateCompanion,
    canAccessCompanion,
    fetchCompanion,
  };
}
