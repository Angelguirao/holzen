import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdge } from '@/lib/invoke-edge';
import { toast as sonnerToast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useToast } from '@/components/ui/use-toast';
import { useCompanionLibraryFavorites } from '@/screens/pause/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import type { InterventionState, RegenerateCompanionSlot } from '@/features/pause/public';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
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
import { getRecencyHints } from '@/features/pause/public';
import {
  applyOrchestrateSlotLazyOrRegenerate,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  hydrateCompanionSlotsFromArtifactCache,
  hydrateOrchestrateSlotsFromInterventionResponse,
  isFilledOrchestrateSlot,
  readOrchestrateSlotBody,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
  type CompanionSlotAutosaveParams,
} from '@/features/pause/public';
import { holzenLog } from '@/lib/holzen-console';
import {
  hasInvokedIntervention,
  resetInterventionIdempotency,
  runOnceIntervention,
  companionSlotToGenerationTaxonomy,
  isCompanionOrchestratePaywallCode,
  isOrchestratePayloadError,
  resolveOrchestrateInvokeUserMessage,
  buildInterventionOrchestrateBody,
  buildLazyFetchOrchestrateBody,
  buildRegenerateOrchestrateBody,
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionOrchestrateSessionContext,
} from '@/features/pause/public';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { isPaidLimitReached, showLimitReachedToast } from '@/features/subscription/public-limits';
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
    if (!isPro) {
      requirePro('companions');
      return false;
    }
    if (isPaidLimitReached({ remaining: companionRemaining, flexCreditsBalance })) {
      showLimitReachedToast({ feature: 'companion', startCheckout });
      return false;
    }
    return true;
  }, [
    isPro,
    requirePro,
    companionRemaining,
    flexCreditsBalance,
    startCheckout,
  ]);

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
  const fetchedRef = useRef<string | null>(null);

  // ── Intervention state (new pause flow) ──
  const [intervention, setIntervention] = useState<InterventionState | null>(null);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionError, setInterventionError] = useState(false);

  // Track which companion slots have already been fetched/requested for this pause instance
  const fetchedSlotsRef = useRef<Set<string>>(new Set());

  // Tracks whether the most recent intervention auto-fetch was short-circuited
  // by the per-tab idempotency guard. Used by `retryOrchestrate` to surface a
  // confirmation toast once the deliberate retry actually issues a fresh call.
  const interventionSkippedRef = useRef<boolean>(false);

  // When `retryOrchestrate` is triggered from a skipped state, we stash the
  // `pauseInstanceId` here so the watcher effect below can fire a confirmation
  // toast as soon as fresh intervention data arrives. Cleared after firing
  // (or on pause switch) so we never confirm twice.
  const pendingRetryConfirmRef = useRef<string | null>(null);

  // Reset all companion state when switching pause instances so stale data from a
  // previous session never leaks into the new one.
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
    setIntervention(null);
    setInterventionError(false);
    setCacheIds({ nudge: null, signal: null, zoomOut: null, history: null });
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    fetchedSlotsRef.current = new Set();
    // New pause → forget any stale skip / retry-confirm state from the
    // previous one so we never confirm a retry against the wrong id.
    interventionSkippedRef.current = false;
    pendingRetryConfirmRef.current = null;

    if (!pauseInstanceId) {
      setInterventionLoading(false);
      return;
    }
    setInterventionLoading(true);
  }, [pauseInstanceId]);

  // Watcher: when a deliberate retry that followed an idempotency skip lands
  // a fresh `intervention` payload, confirm to the user that the retry went
  // through. Single-fire per retry — `pendingRetryConfirmRef` is cleared
  // immediately so re-renders don't re-toast.
  useEffect(() => {
    if (!intervention) return;
    if (!pendingRetryConfirmRef.current) return;
    if (pendingRetryConfirmRef.current !== pauseInstanceId) return;
    sonnerToast.success('New perspective loaded', {
      id: `intervention-retry:${pauseInstanceId}`,
    });
    pendingRetryConfirmRef.current = null;
    interventionSkippedRef.current = false;
  }, [intervention, pauseInstanceId]);

  // ── Intervention-only fetch + cached companion hydration ──
  // Companions are NOT fetched here — only on user tap (see fetchCompanion below).
  useEffect(() => {
    if (!pauseInstanceId) return;

    const key = `${pauseInstanceId}:${retryCount}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    let cancelled = false;
    setInterventionLoading(true);
    setInterventionError(false);

    (async () => {
      try {
        // Hydrate any already-persisted companion data from pause_ai_artifacts
        const cached = await fetchParsedPauseArtifactCache(pauseInstanceId);
        if (cancelled) return;

        const slotCommitters: CompanionSlotCommitters = {
          setSignal,
          setNudge,
          setHistoryInsight,
          setZoomOut,
          autoSaveToLibrary,
        };
        const { hasCachedIntervention } = hydrateCompanionSlotsFromArtifactCache({
          cached,
          fetchedSlots: fetchedSlotsRef.current,
          committers: slotCommitters,
          setIntervention,
        });
        if (hasCachedIntervention) {
          setInterventionLoading(false);
          return;
        }

        // Per-trigger idempotency. If we've already issued the intervention
        // call for this `pauseInstanceId` in the current tab session — even if
        // a remount happened before the server persisted the row that the
        // cache lookup above reads — bail out and wait for the
        // `pause_ai_artifacts` realtime subscription / next remount to
        // hydrate. The `retryOrchestrate` path explicitly resets the marker
        // so a deliberate retry still gets through.
        if (hasInvokedIntervention(pauseInstanceId)) {
          holzenLog.companion('orchestrate intervention skipped (idempotency)', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
          });
          // Passive remount/idempotency skips are expected (StrictMode, quick
          // route bounces). Keep this path silent to avoid surfacing
          // implementation details to users; manual retry remains available.
          interventionSkippedRef.current = true;
          setInterventionLoading(false);
          return;
        }

        // Intervention not cached — fetch from orchestrate (intervention-only, no companion slots)
        const moodHistory = await loadMoodHistoryForOrchestrate();

        holzenLog.companion('orchestrate invoke (intervention only)', {
          holzenInvokeSource: 'browser_pause_intervention',
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
        });

        // Single-flight per `pauseInstanceId`: concurrent renders share the
        // same Promise, and on success a `sessionStorage` marker prevents
        // future remounts in the same tab session from re-issuing the call.
        const orchestrateSession: CompanionOrchestrateSessionContext = {
          pauseInstanceId,
          context: context ?? '',
          language,
          reflectionMessage: reflectionMessage ?? '',
          mood: mood ?? null,
          severity: severityNumber ?? 0,
          moodHistory,
        };
        const { data, error: fnError } = await runOnceIntervention(
          pauseInstanceId,
          () =>
            invokeEdge('companion-orchestrate', {
              body: buildInterventionOrchestrateBody(orchestrateSession),
            }),
        );

        if (cancelled) return;

        const body = data as Record<string, unknown> | null;
        if (isOrchestratePayloadError(fnError, body)) {
          const { code, userMessage } = await resolveOrchestrateInvokeUserMessage(
            fnError,
            body,
            'This AI feature is temporarily unavailable. Please try again in a minute.',
          );
          holzenLog.companion('orchestrate intervention invoke failed', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
            fnError: fnError?.message ?? null,
            bodyError: userMessage,
            bodyCode: code,
          });
          setInterventionError(true);
          setInterventionLoading(false);
          return;
        }

        if (body.intervention) {
          setIntervention(body.intervention as InterventionState);
        } else {
          setInterventionError(true);
        }
        setInterventionLoading(false);

        holzenLog.companion('orchestrate intervention ok', {
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          hasIntervention: Boolean(body.intervention),
        });

        // Hydrate any companion data the server returned alongside intervention
        // (e.g. trap forces grounding, pattern forces history, secondary forces zoomOut)
        const orchestrateBody = (data ?? {}) as Record<string, unknown>;
        const slotCommitters: CompanionSlotCommitters = {
          setSignal,
          setNudge,
          setHistoryInsight,
          setZoomOut,
          autoSaveToLibrary,
        };
        const sigSlot = hydrateOrchestrateSlotsFromInterventionResponse(
          orchestrateBody,
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );
        if (isFilledOrchestrateSlot(sigSlot)) {
          holzenLog.companion('hydrated signal from intervention response', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
            source: sigSlot.source,
            cacheRelaxation: sigSlot.cacheRelaxation ?? null,
          });
        }
      } catch (e) {
        console.error('[useCompanionData] intervention fetch failed', e);
        setInterventionError(true);
      } finally {
        if (!cancelled) setInterventionLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pauseInstanceId, retryCount, context, reflectionMessage, mood, severityNumber, language, autoSaveToLibrary]);

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
      const recency = getRecencyHints();
      const signalSources = slot === 'signal' ? await loadActiveOrchestrateSources('signal') : undefined;
      const groundingSources = slot === 'grounding' ? await loadActiveOrchestrateSources('grounding') : undefined;
      const moodHistory = await loadMoodHistoryForOrchestrate();
      const orchestrateSession: CompanionOrchestrateSessionContext = {
        pauseInstanceId,
        context: context ?? '',
        language,
        reflectionMessage: reflectionMessage ?? '',
        mood: mood ?? null,
        severity: severityNumber ?? 0,
        moodHistory,
      };

      holzenLog.companion('lazy fetch orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_lazy_fetch',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: companionSlotToGenerationTaxonomy(slot),
        source: 'lazy',
      });

      const { data, error: fnError } = await invokeEdge('companion-orchestrate', {
        body: buildLazyFetchOrchestrateBody(orchestrateSession, slot, {
          recency,
          signalSources,
          groundingSources,
        }),
      });

      const body = data as Record<string, unknown> | null;
      if (isOrchestratePayloadError(fnError, body)) {
        const { code, userMessage: msg } = await resolveOrchestrateInvokeUserMessage(
          fnError,
          body,
          'This AI feature is temporarily unavailable. Please try again in a minute.',
        );
        holzenLog.companion('lazy fetch orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          fnError: fnError?.message ?? null,
          bodyError: msg,
          bodyCode: code,
        });
        if (isCompanionOrchestratePaywallCode(code)) {
          // Roll back the optimistic spend and route to the standard
          // upsell so the very-first card tap that hits a paywall lands
          // in the same place as regenerate.
          fetchedSlotsRef.current.delete(slot);
          if (code === 'companions_upgrade_required') {
            requirePro('companions');
          } else {
            showLimitReachedToast({ feature: 'companion', startCheckout });
          }
        } else {
          toast({
            title: 'Companion unavailable',
            description: msg,
            variant: 'destructive',
          });
        }
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
        setCompanionSlotLoading(slot, companionSlotLoadingSetters, false);
        void refreshSubscription();
        return;
      }

      const slotCommitters: CompanionSlotCommitters = {
        setSignal,
        setNudge,
        setHistoryInsight,
        setZoomOut,
        autoSaveToLibrary,
      };
      const r = readOrchestrateSlotBody(body, slot);
      if (isFilledOrchestrateSlot(r)) {
        applyOrchestrateSlotLazyOrRegenerate(slot, r, setCacheIds, slotCommitters, setCacheRelaxations);
        holzenLog.companion('lazy fetch slot filled', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          source: r.source,
          latencyMs: r.latencyMs,
          cacheRelaxation: r.cacheRelaxation ?? null,
          hasCacheId: Boolean(r.cacheId),
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
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    autoSaveToLibrary,
    canAccessCompanion,
    applyOptimisticDecrement,
    refreshSubscription,
    toast,
    requirePro,
    startCheckout,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
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
    setIntervention(null); setInterventionError(false);
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    setRetryCount(c => c + 1);
  }, [pauseInstanceId]);

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
      const recency = getRecencyHints();
      const signalSources = slot === 'signal' ? await loadActiveOrchestrateSources('signal') : undefined;
      const groundingSources = slot === 'grounding' ? await loadActiveOrchestrateSources('grounding') : undefined;
      const moodHistory = await loadMoodHistoryForOrchestrate();
      const orchestrateSession: CompanionOrchestrateSessionContext = {
        pauseInstanceId,
        context: context ?? '',
        language,
        reflectionMessage: reflectionMessage ?? '',
        mood: mood ?? null,
        severity: severityNumber ?? 0,
        moodHistory,
      };

      holzenLog.companion('regenerate orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_regenerate',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: companionSlotToGenerationTaxonomy(slot),
        source: 'regenerate',
      });

      const { data, error: fnError } = await invokeEdge('companion-orchestrate', {
        body: buildRegenerateOrchestrateBody(orchestrateSession, slot, {
          recency,
          signalSources,
          groundingSources,
        }),
      });

      const body = data as Record<string, unknown> | null;
      if (isOrchestratePayloadError(fnError, body)) {
        const { code, userMessage: msg } = await resolveOrchestrateInvokeUserMessage(
          fnError,
          body,
          'This AI feature is temporarily unavailable. Please try again in a minute.',
        );
        holzenLog.companion('regenerate orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          fnError: fnError?.message ?? null,
          bodyError: typeof body?.error === 'string' ? body.error : null,
          bodyCode: code,
        });
        if (isCompanionOrchestratePaywallCode(code)) {
          toast({
            title: 'Companion unavailable',
            description: msg ?? 'This companion is outside your current plan allowance.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Regenerate failed', description: msg, variant: 'destructive' });
        }
        setCompanionSlotError(slot, companionSlotErrorSetters, true);
        return;
      }

      const slotCommitters: CompanionSlotCommitters = {
        setSignal,
        setNudge,
        setHistoryInsight,
        setZoomOut,
        autoSaveToLibrary,
      };
      const r = readOrchestrateSlotBody(body, slot);
      if (isFilledOrchestrateSlot(r)) {
        applyOrchestrateSlotLazyOrRegenerate(slot, r, setCacheIds, slotCommitters, setCacheRelaxations);
        holzenLog.companion('regenerate slot filled', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          source: r.source,
          latencyMs: r.latencyMs,
          cacheRelaxation: r.cacheRelaxation ?? null,
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
    context,
    reflectionMessage,
    mood,
    severityNumber,
    language,
    toast,
    autoSaveToLibrary,
    canAccessCompanion,
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
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
