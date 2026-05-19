import { useState, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdge } from '@/lib/invoke-edge';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useToast } from '@/components/ui/use-toast';
import { useCompanionLibraryFavorites } from '@/screens/pause/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import type { ZoomOutData } from '@/screens/pause/components/ZoomOutDisplay';
import type { CachedHistoricalInsightShape } from '@/screens/pause/components/HistoricalInsightDisplay';
import {
  EMPTY_COMPANION_UI_COMPLETION,
  getCompanionUiCompletionQueryOptions,
  loadActiveOrchestrateSources,
  loadMoodHistoryForOrchestrate,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/public-queries';
import { companionUiCompletionQueryKey } from '@/features/pause/public';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
  type CompanionSlotAutosaveParams,
} from '@/features/pause/public';
import { holzenLog } from '@/lib/holzen-console';
import {
  resetInterventionIdempotency,
  companionSlotToGenerationTaxonomy,
  tryApplyOrchestrateSlotFromBody,
  buildCompanionOrchestrateSessionFromRitual,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
} from '@/features/pause/public';
import { useCompanionInterventionBootstrap } from '@/screens/pause/hooks/use-companion-intervention-bootstrap';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import {
  classifyCompanionAccessDenied,
  showLimitReachedToast,
} from '@/features/subscription/public-limits';
import { trackEvent } from '@/lib/posthog';

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/features/pause/public';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface SignalData {
  title: string;
  body: string;
  source: string;
  /** Canonical first-publication URL — prioritized over any mirror upstream. */
  url: string;
}

interface UseCompanionDataParams {
  companions: CompanionData;
  prefs: CompanionPrefs;
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  /** Current user mood — passed to intervention selector */
  mood?: string | null;
  /** Raw numeric BTC % change — passed to intervention selector for bucketing */
  severityNumber?: number;
}

export function useCompanionData({ companions, prefs, pauseInstanceId, context, reflectionMessage, mood, severityNumber }: UseCompanionDataParams) {
  const { language } = useHolzen();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { favorites, toggleCompanionFavorite } = useCompanionLibraryFavorites(pauseInstanceId);
  const { isPro, requirePro, startCheckout } = useProGate();
  const { companionRemaining, flexCreditsBalance, applyOptimisticDecrement, refresh: refreshSubscription } = useSubscription();

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

  /** No-op: companion output is persisted in `pause_ai_artifacts` only. */
  const autoSaveToLibrary = useCallback(async (_params: CompanionSlotAutosaveParams) => {}, []);

  // ── Completion state (TanStack: shared per pause id, deduped vs useEffect fetch) ──
  const completionQuery = useQuery(getCompanionUiCompletionQueryOptions(pauseInstanceId));
  const completion = completionQuery.data ?? EMPTY_COMPANION_UI_COMPLETION;

  const [cacheIds, setCacheIds] = useState<CompanionSlotCacheIds>({
    nudge: null,
    signal: null,
    zoomOut: null,
    history: null,
  });
  const [cacheRelaxations, setCacheRelaxations] = useState<CompanionSlotRelaxations>(EMPTY_COMPANION_SLOT_RELAXATIONS);

  const markCompleted = useCallback(async (key: CompanionUiCompletionStep) => {
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
  }, [pauseInstanceId, queryClient, completionQuery.data]);

  // ── Companion state ──
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);

  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);

  const [zoomOut, setZoomOut] = useState<ZoomOutData | null>(null);
  const [zoomOutLoading, setZoomOutLoading] = useState(false);
  const [zoomOutError, setZoomOutError] = useState(false);

  const [historyInsight, setHistoryInsight] = useState<CachedHistoricalInsightShape | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const companionSlotLoadingSetters = useMemo(
    () => ({
      setSignalLoading,
      setNudgeLoading,
      setHistoryLoading,
      setZoomOutLoading,
    }),
    [setSignalLoading, setNudgeLoading, setHistoryLoading, setZoomOutLoading],
  );
  const companionSlotErrorSetters = useMemo(
    () => ({
      setSignalError,
      setNudgeError,
      setHistoryError,
      setZoomOutError,
    }),
    [setSignalError, setNudgeError, setHistoryError, setZoomOutError],
  );

  const [retryCount, setRetryCount] = useState(0);

  // Track which companion slots have already been fetched/requested for this pause instance
  const fetchedSlotsRef = useRef<Set<string>>(new Set());

  const slotCommitters = useMemo<CompanionSlotCommitters>(
    () => ({
      setSignal,
      setNudge,
      setHistoryInsight,
      setZoomOut,
      autoSaveToLibrary,
    }),
    [autoSaveToLibrary],
  );

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

  const slotOrchestratePorts = useMemo(
    () => ({
      loadSignalSources: () => loadActiveOrchestrateSources('signal'),
      loadGroundingSources: () => loadActiveOrchestrateSources('grounding'),
      invoke: (body: Record<string, unknown>) =>
        invokeEdge('companion-orchestrate', { body }),
    }),
    [],
  );

  const buildOrchestrateSession = useCallback(async () => {
    if (!pauseInstanceId) return null;
    const moodHistory = await loadMoodHistoryForOrchestrate();
    return buildCompanionOrchestrateSessionFromRitual({
      pauseInstanceId,
      context,
      language,
      reflectionMessage,
      mood,
      severityNumber,
      moodHistory,
    });
  }, [pauseInstanceId, context, language, reflectionMessage, mood, severityNumber]);

  // Reset companion slot state when switching pause instances (intervention reset lives in bootstrap hook).
  useLayoutEffect(() => {
    setSignal(null);
    setSignalLoading(false);
    setSignalError(false);
    setNudge(null);
    setNudgeLoading(false);
    setNudgeError(false);
    setZoomOut(null);
    setZoomOutLoading(false);
    setZoomOutError(false);
    setHistoryInsight(null);
    setHistoryLoading(false);
    setHistoryError(false);
    setCacheIds({ nudge: null, signal: null, zoomOut: null, history: null });
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    fetchedSlotsRef.current = new Set();
  }, [pauseInstanceId]);

  // ── On-demand companion slot fetch (triggered when user taps a card) ──
  const fetchCompanion = useCallback(async (slot: RegenerateCompanionSlot) => {
    if (!pauseInstanceId) return;
    if (fetchedSlotsRef.current.has(slot)) return;

    // Mirror the regenerate paywall: free users get the standard upgrade
    // toast; Pro users with neither bucket nor flex credits left get the
    // limit-reached toast. Without this gate the very first card tap
    // surfaced a generic "Companion unavailable" toast even though the
    // edge function was returning a paywall code.
    if (!canAccessCompanion()) {
      return;
    }

    fetchedSlotsRef.current.add(slot);
    // Reflect the spend instantly; refresh below reconciles with the server.
    applyOptimisticDecrement('companion');

    setCompanionSlotLoading(slot, companionSlotLoadingSetters, true);
    setCompanionSlotError(slot, companionSlotErrorSetters, false);

    try {
      const orchestrateSession = await buildOrchestrateSession();
      if (!orchestrateSession) return;

      holzenLog.companion('lazy fetch orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_lazy_fetch',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: companionSlotToGenerationTaxonomy(slot),
        source: 'lazy',
      });

      const result = await runCompanionSlotOrchestrate(
        'lazy_fetch',
        slot,
        orchestrateSession,
        slotOrchestratePorts,
      );

      if (result.status === 'failure') {
        const lazyFailure = result.failure;
        holzenLog.companion('lazy fetch orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          bodyError: lazyFailure.userMessage,
          bodyCode: lazyFailure.code,
        });
        if (lazyFailure.isPaywall) {
          fetchedSlotsRef.current.delete(slot);
          if (lazyFailure.code === 'companions_upgrade_required') {
            requirePro('companions');
          } else {
            showLimitReachedToast({ feature: 'companion', startCheckout });
          }
        } else {
          toast({
            title: 'Companion unavailable',
            description: lazyFailure.userMessage,
            variant: 'destructive',
          });
        }
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
        setCompanionSlotLoading(slot, companionSlotLoadingSetters, false);
        void refreshSubscription();
        return;
      }

      const filled = tryApplyOrchestrateSlotFromBody(
        result.body,
        slot,
        setCacheIds,
        slotCommitters,
        setCacheRelaxations,
      );
      if (filled) {
        holzenLog.companion('lazy fetch slot filled', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });
      } else {
        holzenLog.companion('lazy fetch empty or error slot', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
      }
    } catch (e) {
      console.error('[useCompanionData] fetchCompanion failed', slot, e);
      setCompanionSlotError(slot, companionSlotErrorSetters, true);
    } finally {
      setCompanionSlotLoading(slot, companionSlotLoadingSetters, false);
      void refreshSubscription();
    }
  }, [
    pauseInstanceId,
    canAccessCompanion,
    applyOptimisticDecrement,
    refreshSubscription,
    toast,
    requirePro,
    startCheckout,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
    slotCommitters,
    buildOrchestrateSession,
    slotOrchestratePorts,
  ]);

  // ── Retry helpers ──
  const retrySlot = useCallback((slot: RegenerateCompanionSlot) => {
    fetchedSlotsRef.current.delete(slot);
    fetchCompanion(slot);
  }, [fetchCompanion]);
  const retryNudge = useCallback(() => retrySlot('grounding'), [retrySlot]);
  const retrySignal = useCallback(() => retrySlot('signal'), [retrySlot]);
  const retryZoomOut = useCallback(() => retrySlot('zoomOut'), [retrySlot]);
  const retryHistory = useCallback(() => retrySlot('history'), [retrySlot]);
  /** Re-run companion-orchestrate (intervention + reset companion slots). */
  const retryOrchestrate = useCallback(() => {
    // Clear the per-trigger idempotency guard so the next render can fire a
    // fresh `companion-orchestrate` call. Without this the user-facing
    // "Try again" affordance would silently skip due to the marker set on
    // the previous (failed or stale) attempt.
    if (pauseInstanceId) resetInterventionIdempotency(pauseInstanceId);
    // If the prior auto-fetch was short-circuited by idempotency, arm the
    // success-confirmation toast (fired below in the effect that watches
    // `intervention`) once this deliberate retry lands.
    if (interventionSkippedRef.current && pauseInstanceId) {
      pendingRetryConfirmRef.current = pauseInstanceId;
    }
    fetchedSlotsRef.current = new Set();
    setSignal(null); setSignalError(false);
    setNudge(null); setNudgeError(false);
    setZoomOut(null); setZoomOutError(false);
    setHistoryInsight(null); setHistoryError(false);
    setIntervention(null);
    setInterventionError(false);
    clearInterventionFetchDedupe();
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    setRetryCount(c => c + 1);
  }, [
    pauseInstanceId,
    setIntervention,
    setInterventionError,
    clearInterventionFetchDedupe,
    interventionSkippedRef,
    pendingRetryConfirmRef,
  ]);

  const regenerateCompanion = useCallback(async (slot: RegenerateCompanionSlot) => {
    if (!pauseInstanceId) return;
    // Defensive gate: some callers already block before invoking this
    // callback, but enforcing the check here guarantees we never issue a
    // paid regenerate request when the user is out of allowance/credits.
    if (!canAccessCompanion()) {
      return;
    }
    setCompanionSlotLoading(slot, companionSlotLoadingSetters, true);
    setCompanionSlotError(slot, companionSlotErrorSetters, false);
    try {
      const orchestrateSession = await buildOrchestrateSession();
      if (!orchestrateSession) return;

      holzenLog.companion('regenerate orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_regenerate',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: companionSlotToGenerationTaxonomy(slot),
        source: 'regenerate',
      });

      const result = await runCompanionSlotOrchestrate(
        'regenerate',
        slot,
        orchestrateSession,
        slotOrchestratePorts,
      );

      if (result.status === 'failure') {
        const regenerateFailure = result.failure;
        holzenLog.companion('regenerate orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          bodyError: regenerateFailure.userMessage,
          bodyCode: regenerateFailure.code,
        });
        if (regenerateFailure.isPaywall) {
          toast({
            title: 'Companion unavailable',
            description:
              regenerateFailure.userMessage ??
              'This companion is outside your current plan allowance.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Regenerate failed',
            description: regenerateFailure.userMessage,
            variant: 'destructive',
          });
        }
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
        return;
      }

      const filled = tryApplyOrchestrateSlotFromBody(
        result.body,
        slot,
        setCacheIds,
        slotCommitters,
        setCacheRelaxations,
      );
      if (filled) {
        holzenLog.companion('regenerate slot filled', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });
      } else {
        holzenLog.companion('regenerate empty slot', { slot, pause_instance_prefix: pauseInstanceId.slice(0, 8) });
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
      }
    } catch (e) {
      console.error('[useCompanionData] regenerateCompanion', e);
      toast({ title: 'Regenerate failed', description: 'Network error', variant: 'destructive' });
      setCompanionSlotError(slot, companionSlotErrorSetters, true);
    } finally {
      setCompanionSlotLoading(slot, companionSlotLoadingSetters, false);
    }
  }, [
    pauseInstanceId,
    toast,
    canAccessCompanion,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
    slotCommitters,
    buildOrchestrateSession,
    slotOrchestratePorts,
  ]);

  return {
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    cacheIds,
    cacheRelaxations,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
    intervention, interventionLoading, interventionError,
    retryOrchestrate,
    regenerateCompanion,
    canAccessCompanion,
    fetchCompanion,
  };
}
