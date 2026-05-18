import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdge } from '@/lib/invoke-edge';
import { toast as sonnerToast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import { useToast } from '@/hooks/use-toast';
import { useCompanionLibraryFavorites } from '@/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { InterventionState, RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { fetchParsedPauseArtifactCache } from '@/features/pause/public-queries';
import type { ZoomOutData } from '@/components/ZoomOutDisplay';
import { toZoomOutDisplayData, zoomOutLibraryAutosaveFromDisplayData } from '@/features/pause/application/companion/zoom-out-payload';
import type { CachedHistoricalInsightShape } from '@/components/HistoricalInsightDisplay';
import {
  EMPTY_COMPANION_UI_COMPLETION,
  getCompanionUiCompletionQueryOptions,
  loadActiveOrchestrateSources,
  loadMoodHistoryForOrchestrate,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionStep,
  type CompanionUiCompletionState,
} from '@/features/pause/public-queries';
import { companionUiCompletionQueryKey } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import { getRecencyHints } from '@/features/pause/application/companion/recency-hints';
import { parseEdgeFunctionError, toUserFacingAiErrorMessage } from '@/lib/edge-function-error';
import {
  applyOrchestrateSlotLazyOrRegenerate,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  hydrateOrchestrateSlotIfNew,
  isFilledOrchestrateSlot,
  readOrchestrateSlotBody,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
  type CompanionSlotAutosaveParams,
} from '@/features/pause/application/companion/orchestrate-slot-apply';
import { holzenLog } from '@/lib/holzen-console';
import {
  hasInvokedIntervention,
  resetInterventionIdempotency,
  runOnceIntervention,
} from '@/features/pause/public';
import { useSubscription } from '@/hooks/use-subscription';
import { useProGate } from '@/hooks/use-pro-gate';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';
import { trackEvent } from '@/lib/posthog';
import { trackCompanionServed } from '@/features/pause/application/companion/analytics';

const GEN_TYPE_BY_SLOT: Record<RegenerateCompanionSlot, 'signal' | 'grounding' | 'history' | 'zoom_out'> = {
  signal: 'signal',
  grounding: 'grounding',
  history: 'history',
  zoomOut: 'zoom_out',
};

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/features/pause/domain/companion-orchestrate';

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

        if (cached.signal) {
          setSignal(cached.signal);
          fetchedSlotsRef.current.add('signal');
          trackCompanionServed('signal', 'cache');
          autoSaveToLibrary({ title: cached.signal.title, body: cached.signal.body, sourceType: 'signal', sourceUrl: cached.signal.url });
        }
        if (cached.grounding) {
          setNudge(cached.grounding);
          fetchedSlotsRef.current.add('grounding');
          trackCompanionServed('grounding', 'cache');
          autoSaveToLibrary({ title: cached.grounding.title, body: cached.grounding.body, sourceType: 'grounding', sourceUrl: cached.grounding.url });
        }
        if (cached.history) {
          setHistoryInsight(cached.history);
          fetchedSlotsRef.current.add('history');
          trackCompanionServed('history', 'cache');
          autoSaveToLibrary({ title: cached.history.title, body: cached.history.btcInsight, sourceType: 'history_insight' });
        }
        if (cached.zoomOut) {
          const z = toZoomOutDisplayData(cached.zoomOut);
          setZoomOut(z);
          fetchedSlotsRef.current.add('zoomOut');
          trackCompanionServed('zoomOut', 'cache');
          const { title, body } = zoomOutLibraryAutosaveFromDisplayData(z);
          autoSaveToLibrary({ title, body, sourceType: 'zoom_out' });
        }
        if (cached.intervention) {
          setIntervention(cached.intervention);
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
        const { data, error: fnError } = await runOnceIntervention(
          pauseInstanceId,
          () =>
            invokeEdge('companion-orchestrate', {
              body: {
                holzenInvokeSource: 'browser_pause_intervention',
                pauseInstanceId,
                context: context ?? '',
                language,
                reflectionMessage: reflectionMessage ?? '',
                mood: mood ?? null,
                severity: severityNumber ?? 0,
                moodHistory,
                enableSignal: false,
                enableGrounding: false,
                enableHistory: false,
                enableZoomOut: false,
                useIntervention: true,
              },
            }),
        );

        if (cancelled) return;

        const body = data as Record<string, unknown> | null;
        if (!!fnError || !body || Boolean(body.error)) {
          holzenLog.companion('orchestrate intervention invoke failed', {
            pause_instance_prefix: pauseInstanceId.slice(0, 8),
            fnError: fnError?.message ?? null,
            bodyError: typeof body?.error === 'string' ? body.error : null,
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
        hydrateOrchestrateSlotIfNew(
          'grounding',
          readOrchestrateSlotBody(orchestrateBody, 'grounding'),
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );
        hydrateOrchestrateSlotIfNew(
          'history',
          readOrchestrateSlotBody(orchestrateBody, 'history'),
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );
        hydrateOrchestrateSlotIfNew(
          'zoomOut',
          readOrchestrateSlotBody(orchestrateBody, 'zoomOut'),
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );
        hydrateOrchestrateSlotIfNew(
          'signal',
          readOrchestrateSlotBody(orchestrateBody, 'signal'),
          fetchedSlotsRef.current,
          slotCommitters,
          setCacheRelaxations,
        );

        const sigSlot = readOrchestrateSlotBody(orchestrateBody, 'signal');
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

    const setLoading = (v: boolean) => {
      if (slot === 'signal') setSignalLoading(v);
      else if (slot === 'grounding') setNudgeLoading(v);
      else if (slot === 'history') setHistoryLoading(v);
      else setZoomOutLoading(v);
    };
    const setErr = (v: boolean) => {
      if (slot === 'signal') setSignalError(v);
      else if (slot === 'grounding') setNudgeError(v);
      else if (slot === 'history') setHistoryError(v);
      else setZoomOutError(v);
    };
    setLoading(true);
    setErr(false);

    try {
      const recency = getRecencyHints();
      const signalSources = slot === 'signal' ? await loadActiveOrchestrateSources('signal') : undefined;
      const groundingSources = slot === 'grounding' ? await loadActiveOrchestrateSources('grounding') : undefined;
      const moodHistory = await loadMoodHistoryForOrchestrate();

      holzenLog.companion('lazy fetch orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_lazy_fetch',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: GEN_TYPE_BY_SLOT[slot],
        source: 'lazy',
      });

      const { data, error: fnError } = await invokeEdge('companion-orchestrate', {
        body: {
          holzenInvokeSource: 'browser_lazy_fetch',
          pauseInstanceId,
          context: context ?? '',
          language,
          reflectionMessage: reflectionMessage ?? '',
          mood: mood ?? null,
          severity: severityNumber ?? 0,
          moodHistory,
          signalSources,
          groundingSources,
          ...recency,
          enableSignal: slot === 'signal',
          enableGrounding: slot === 'grounding',
          enableHistory: slot === 'history',
          enableZoomOut: slot === 'zoomOut',
          useIntervention: false,
        },
      });

      const body = data as Record<string, unknown> | null;
      const payloadError = !!fnError || !body || Boolean(body.error);
      if (payloadError) {
        const parsedError = fnError ? await parseEdgeFunctionError(fnError) : { code: null, message: null, details: null };
        const code = typeof body?.code === 'string' ? body.code : parsedError.code;
        const msg = toUserFacingAiErrorMessage(
          {
            ...parsedError,
            message: typeof body?.error === 'string' ? body.error : parsedError.message,
          },
          'This AI feature is temporarily unavailable. Please try again in a minute.',
        );
        holzenLog.companion('lazy fetch orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          fnError: fnError?.message ?? null,
          bodyError: msg,
          bodyCode: code,
        });
        if (code === 'companions_quota_exceeded' || code === 'companions_upgrade_required') {
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
        setErr(true);
        setLoading(false);
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
        setErr(true);
      }
    } catch (e) {
      console.error('[useCompanionData] fetchCompanion failed', slot, e);
      setErr(true);
    } finally {
      setLoading(false);
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
    const setLoading = (v: boolean) => {
      if (slot === 'signal') setSignalLoading(v);
      else if (slot === 'grounding') setNudgeLoading(v);
      else if (slot === 'history') setHistoryLoading(v);
      else setZoomOutLoading(v);
    };
    const setErr = (v: boolean) => {
      if (slot === 'signal') setSignalError(v);
      else if (slot === 'grounding') setNudgeError(v);
      else if (slot === 'history') setHistoryError(v);
      else setZoomOutError(v);
    };
    setLoading(true);
    setErr(false);
    try {
      const recency = getRecencyHints();
      const signalSources = slot === 'signal' ? await loadActiveOrchestrateSources('signal') : undefined;
      const groundingSources = slot === 'grounding' ? await loadActiveOrchestrateSources('grounding') : undefined;
      const moodHistory = await loadMoodHistoryForOrchestrate();

      holzenLog.companion('regenerate orchestrate invoke', {
        slot,
        holzenInvokeSource: 'browser_regenerate',
        pause_instance_prefix: pauseInstanceId.slice(0, 8),
      });

      trackEvent('generation.initiated', {
        companion_type: GEN_TYPE_BY_SLOT[slot],
        source: 'regenerate',
      });

      const { data, error: fnError } = await invokeEdge('companion-orchestrate', {
        body: {
          holzenInvokeSource: 'browser_regenerate',
          pauseInstanceId,
          regenerateOnly: slot,
          context: context ?? '',
          language,
          reflectionMessage: reflectionMessage ?? '',
          mood: mood ?? null,
          severity: severityNumber ?? 0,
          moodHistory,
          signalSources,
          groundingSources,
          ...recency,
        },
      });

      const body = data as Record<string, unknown> | null;
      const payloadError = !!fnError || !body || Boolean(body.error);
      if (payloadError) {
        const parsedError = fnError ? await parseEdgeFunctionError(fnError) : { code: null, message: null, details: null };
        const code = typeof body?.code === 'string' ? body.code : parsedError.code;
        const msg = toUserFacingAiErrorMessage(
          {
            ...parsedError,
            message:
              typeof body?.error === 'string'
                ? body.error
                : parsedError.message ?? fnError?.message,
          },
          'This AI feature is temporarily unavailable. Please try again in a minute.',
        );
        holzenLog.companion('regenerate orchestrate failed', {
          slot,
          pause_instance_prefix: pauseInstanceId.slice(0, 8),
          fnError: fnError?.message ?? null,
          bodyError: typeof body?.error === 'string' ? body.error : null,
          bodyCode: code,
        });
        if (code === 'companions_quota_exceeded' || code === 'companions_upgrade_required') {
          toast({
            title: 'Companion unavailable',
            description: msg ?? 'This companion is outside your current plan allowance.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Regenerate failed', description: msg, variant: 'destructive' });
        }
        setErr(true);
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
        setErr(true);
      }
    } catch (e) {
      console.error('[useCompanionData] regenerateCompanion', e);
      toast({ title: 'Regenerate failed', description: 'Network error', variant: 'destructive' });
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [pauseInstanceId, context, reflectionMessage, mood, severityNumber, language, toast, autoSaveToLibrary, canAccessCompanion]);

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
