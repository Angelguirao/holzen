import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useCompanionLibraryFavorites } from '@/screens/pause/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import {
  EMPTY_COMPANION_UI_COMPLETION,
  getCompanionUiCompletionQueryOptions,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/public-queries';
import { companionUiCompletionQueryKey } from '@/features/pause/public';
import { EMPTY_COMPANION_SLOT_RELAXATIONS } from '@/features/pause/public';
import { resetInterventionIdempotency } from '@/features/pause/public';
import { useCompanionInterventionBootstrap } from '@/screens/pause/hooks/use-companion-intervention-bootstrap';
import { useCompanionSlotUiState } from '@/screens/pause/hooks/use-companion-slot-ui-state';
import { useCompanionSlotOrchestrateActions } from '@/screens/pause/hooks/use-companion-slot-orchestrate-actions';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import {
  classifyCompanionAccessDenied,
  showLimitReachedToast,
} from '@/features/subscription/public-limits';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { favorites, toggleCompanionFavorite } = useCompanionLibraryFavorites(pauseInstanceId);
  const { isPro, requirePro, startCheckout } = useProGate();
  const { companionRemaining, flexCreditsBalance, applyOptimisticDecrement, refresh: refreshSubscription } =
    useSubscription();

  const canAccessCompanion = useCallback(() => {
    const denied = classifyCompanionAccessDenied({
      isPro,
      companionRemaining,
      flexCreditsBalance,
    });
    if (!denied) return true;
    if (denied === 'upgrade_required') {
      requirePro('companions');
    } else {
      showLimitReachedToast({ feature: 'companion', startCheckout });
    }
    return false;
  }, [isPro, requirePro, companionRemaining, flexCreditsBalance, startCheckout]);

  const completionQuery = useQuery(getCompanionUiCompletionQueryOptions(pauseInstanceId));
  const completion = completionQuery.data ?? EMPTY_COMPANION_UI_COMPLETION;

  const markCompleted = useCallback(
    async (key: CompanionUiCompletionStep) => {
      const id = pauseInstanceId;
      if (!id) return;
      const keyFull = companionUiCompletionQueryKey(id);
      const snap =
        queryClient.getQueryData<CompanionUiCompletionState>(keyFull) ??
        completionQuery.data ??
        EMPTY_COMPANION_UI_COMPLETION;
      if (snap[key]) return;
      queryClient.setQueryData<CompanionUiCompletionState>(keyFull, { ...snap, [key]: true });
      hapticFeedback('light');
      await persistCompanionUiStepCompletion(id, key);
    },
    [pauseInstanceId, queryClient, completionQuery.data],
  );

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

  const retryOrchestrate = useCallback(() => {
    if (pauseInstanceId) resetInterventionIdempotency(pauseInstanceId);
    if (interventionSkippedRef.current && pauseInstanceId) {
      pendingRetryConfirmRef.current = pauseInstanceId;
    }
    fetchedSlotsRef.current = new Set();
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
    clearInterventionFetchDedupe();
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    setRetryCount((c) => c + 1);
  }, [
    pauseInstanceId,
    setIntervention,
    setInterventionError,
    clearInterventionFetchDedupe,
    interventionSkippedRef,
    pendingRetryConfirmRef,
  ]);

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
