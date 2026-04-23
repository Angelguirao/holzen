import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import { useToast } from '@/hooks/use-toast';
import { useCompanionLibraryFavorites } from '@/hooks/use-companion-library-favorites';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { RegenerateCompanionSlot, InterventionState } from '@/lib/companion-orchestrate-types';
import {
  fetchParsedReflectionCompanionCache,
} from '@/lib/companion-reflection-cache';
import type { CachedHistoricalInsightShape } from '@/lib/companion-reflection-cache';
import type { CompanionUiCompletionStep } from '@/lib/companion-completion-sync';
import {
  loadCompanionUiCompletionState,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionState,
} from '@/lib/companion-completion-sync';
import { loadMoodHistoryForOrchestrate } from '@/lib/companion-mood-history';
import { loadActiveOrchestrateSources } from '@/lib/companion-orchestrate-sources';
import { getRecencyHints } from '@/lib/companion-recency-hints';
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
} from '@/lib/companion-orchestrate-slot-apply';
import { saveCompanionLibraryBookmarkOnce } from '@/lib/companion-library-autosave';
import { holzenLog } from '@/lib/holzen-console';
import {
  hasInvokedIntervention,
  resetInterventionIdempotency,
  runOnceIntervention,
} from '@/lib/orchestrate-intervention-idempotency';
import { useSubscription } from '@/hooks/use-subscription';
import { useProGate } from '@/hooks/use-pro-gate';
import { showLimitReachedToast, isPaidLimitReached } from '@/lib/limit-upsell';

export type {
  RegenerateCompanionSlot,
  InterventionPrimary,
  InterventionSecondary,
  InterventionState,
} from '@/lib/companion-orchestrate-types';

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
  reflectionId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  /** Current user mood — passed to intervention selector */
  mood?: string | null;
  /** Raw numeric BTC % change — passed to intervention selector for bucketing */
  severityNumber?: number;
}

export function useCompanionData({ companions, prefs, reflectionId, context, reflectionMessage, mood, severityNumber }: UseCompanionDataParams) {
  const { language } = useHolzen();
  const { toast } = useToast();
  const { favorites, toggleCompanionFavorite } = useCompanionLibraryFavorites(reflectionId);
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

  // ── Auto-save to library ──
  const libraryAutosaveDedupRef = useRef<Set<string>>(new Set());
  const autoSaveToLibrary = useCallback(
    async (params: { title: string; body: string; sourceType: string; sourceUrl?: string }) => {
      await saveCompanionLibraryBookmarkOnce(reflectionId, params, libraryAutosaveDedupRef.current);
    },
    [reflectionId],
  );

  // ── Completion state ──
  const [completion, setCompletion] = useState<CompanionUiCompletionState>({
    breathing: false,
    haiku: false,
    grounding: false,
    signal: false,
    zoomOut: false,
    history: false,
  });
  const [cacheIds, setCacheIds] = useState<CompanionSlotCacheIds>({
    nudge: null,
    signal: null,
    zoomOut: null,
    history: null,
  });
  const [cacheRelaxations, setCacheRelaxations] = useState<CompanionSlotRelaxations>(EMPTY_COMPANION_SLOT_RELAXATIONS);

  useEffect(() => {
    if (!reflectionId) return;
    loadCompanionUiCompletionState(reflectionId).then(setCompletion);
  }, [reflectionId]);

  const markCompleted = useCallback(async (key: CompanionUiCompletionStep) => {
    if (completion[key]) return;
    setCompletion((prev) => ({ ...prev, [key]: true }));
    hapticFeedback('light');
    if (reflectionId) {
      await persistCompanionUiStepCompletion(reflectionId, key);
    }
  }, [reflectionId, completion]);

  // ── Companion state ──
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);

  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);

  const [zoomOut, setZoomOut] = useState<any>(null);
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

  // Track which companion slots have already been fetched/requested for this reflection
  const fetchedSlotsRef = useRef<Set<string>>(new Set());

  // Tracks whether the most recent intervention auto-fetch was short-circuited
  // by the per-tab idempotency guard. Used by `retryOrchestrate` to surface a
  // confirmation toast once the deliberate retry actually issues a fresh call.
  const interventionSkippedRef = useRef<boolean>(false);

  // When `retryOrchestrate` is triggered from a skipped state, we stash the
  // `reflectionId` here so the watcher effect below can fire a confirmation
  // toast as soon as fresh intervention data arrives. Cleared after firing
  // (or on reflection switch) so we never confirm twice.
  const pendingRetryConfirmRef = useRef<string | null>(null);

  // Reset all companion state when switching reflections so stale data from a
  // previous reflection never leaks into the new one.
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
    // New reflection → forget any stale skip / retry-confirm state from the
    // previous one so we never confirm a retry against the wrong id.
    interventionSkippedRef.current = false;
    pendingRetryConfirmRef.current = null;

    if (!reflectionId) {
      setInterventionLoading(false);
      return;
    }
    setInterventionLoading(true);
  }, [reflectionId]);

  // Watcher: when a deliberate retry that followed an idempotency skip lands
  // a fresh `intervention` payload, confirm to the user that the retry went
  // through. Single-fire per retry — `pendingRetryConfirmRef` is cleared
  // immediately so re-renders don't re-toast.
  useEffect(() => {
    if (!intervention) return;
    if (!pendingRetryConfirmRef.current) return;
    if (pendingRetryConfirmRef.current !== reflectionId) return;
    sonnerToast.success('New perspective loaded', {
      id: `intervention-retry:${reflectionId}`,
    });
    pendingRetryConfirmRef.current = null;
    interventionSkippedRef.current = false;
  }, [intervention, reflectionId]);

  // ── Intervention-only fetch + cached companion hydration ──
  // Companions are NOT fetched here — only on user tap (see fetchCompanion below).
  useEffect(() => {
    if (!reflectionId) return;

    const key = `${reflectionId}:${retryCount}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    let cancelled = false;
    setInterventionLoading(true);
    setInterventionError(false);

    (async () => {
      try {
        // Hydrate any already-persisted companion data from reflection_companions
        const cached = await fetchParsedReflectionCompanionCache(reflectionId);
        if (cancelled) return;

        if (cached.signal) {
          setSignal(cached.signal);
          fetchedSlotsRef.current.add('signal');
          autoSaveToLibrary({ title: cached.signal.title, body: cached.signal.body, sourceType: 'signal', sourceUrl: cached.signal.url });
        }
        if (cached.grounding) {
          setNudge(cached.grounding);
          fetchedSlotsRef.current.add('grounding');
          autoSaveToLibrary({ title: cached.grounding.title, body: cached.grounding.body, sourceType: 'grounding', sourceUrl: cached.grounding.url });
        }
        if (cached.history) {
          setHistoryInsight(cached.history);
          fetchedSlotsRef.current.add('history');
          autoSaveToLibrary({ title: cached.history.title, body: cached.history.btcInsight, sourceType: 'history_insight' });
        }
        if (cached.zoomOut) {
          setZoomOut(cached.zoomOut);
          fetchedSlotsRef.current.add('zoomOut');
          const zoomBody = cached.zoomOut?.deepTime?.body || cached.zoomOut?.echo?.message || 'Zoom Out perspective';
          autoSaveToLibrary({ title: cached.zoomOut?.deepTime?.title || 'Zoom Out', body: zoomBody, sourceType: 'zoom_out' });
        }
        if (cached.intervention) {
          setIntervention(cached.intervention);
          setInterventionLoading(false);
          return;
        }

        // Per-trigger idempotency. If we've already issued the intervention
        // call for this `reflectionId` in the current tab session — even if
        // a remount happened before the server persisted the row that the
        // cache lookup above reads — bail out and wait for the
        // `reflection_companions` realtime subscription / next remount to
        // hydrate. The `retryOrchestrate` path explicitly resets the marker
        // so a deliberate retry still gets through.
        if (hasInvokedIntervention(reflectionId)) {
          holzenLog.companion('orchestrate intervention skipped (idempotency)', {
            reflection_prefix: reflectionId.slice(0, 8),
          });
          // Surface a distinct, non-blocking message so the user understands
          // why nothing is loading on this remount and knows the "Try again"
          // affordance is the way forward. Tagged with a stable id so we don't
          // stack duplicates across StrictMode / fast remounts.
          interventionSkippedRef.current = true;
          sonnerToast('Already loaded for this pause', {
            id: `intervention-skip:${reflectionId}`,
            description: 'Tap "Try again" to fetch a fresh perspective.',
          });
          setInterventionLoading(false);
          return;
        }

        // Intervention not cached — fetch from orchestrate (intervention-only, no companion slots)
        const moodHistory = await loadMoodHistoryForOrchestrate();

        holzenLog.companion('orchestrate invoke (intervention only)', {
          holzenInvokeSource: 'browser_pause_intervention',
          reflection_prefix: reflectionId.slice(0, 8),
        });

        // Single-flight per `reflectionId`: concurrent renders share the
        // same Promise, and on success a `sessionStorage` marker prevents
        // future remounts in the same tab session from re-issuing the call.
        const { data, error: fnError } = await runOnceIntervention(
          reflectionId,
          () =>
            supabase.functions.invoke('companion-orchestrate', {
              body: {
                holzenInvokeSource: 'browser_pause_intervention',
                reflectionId,
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
            reflection_prefix: reflectionId.slice(0, 8),
            fnError: fnError?.message ?? null,
            bodyError: typeof body?.error === 'string' ? body.error : null,
          });
          setInterventionError(true);
          setInterventionLoading(false);
          return;
        }

        if (data.intervention) {
          setIntervention(data.intervention as InterventionState);
        } else {
          setInterventionError(true);
        }
        setInterventionLoading(false);

        holzenLog.companion('orchestrate intervention ok', {
          reflection_prefix: reflectionId.slice(0, 8),
          hasIntervention: Boolean(data.intervention),
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
            reflection_prefix: reflectionId.slice(0, 8),
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
  }, [reflectionId, retryCount, context, reflectionMessage, mood, severityNumber, language, autoSaveToLibrary]);

  // ── On-demand companion slot fetch (triggered when user taps a card) ──
  const fetchCompanion = useCallback(async (slot: RegenerateCompanionSlot) => {
    if (!reflectionId) return;
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
        reflection_prefix: reflectionId.slice(0, 8),
      });

      const { data, error: fnError } = await supabase.functions.invoke('companion-orchestrate', {
        body: {
          holzenInvokeSource: 'browser_lazy_fetch',
          reflectionId,
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
          reflection_prefix: reflectionId.slice(0, 8),
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
          reflection_prefix: reflectionId.slice(0, 8),
          source: r.source,
          latencyMs: r.latencyMs,
          cacheRelaxation: r.cacheRelaxation ?? null,
          hasCacheId: Boolean(r.cacheId),
        });
      } else {
        holzenLog.companion('lazy fetch empty or error slot', {
          slot,
          reflection_prefix: reflectionId.slice(0, 8),
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
    reflectionId,
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
    if (reflectionId) resetInterventionIdempotency(reflectionId);
    // If the prior auto-fetch was short-circuited by idempotency, dismiss
    // the "Already loaded" notice and arm the success-confirmation toast
    // (fired below in the effect that watches `intervention`).
    if (interventionSkippedRef.current && reflectionId) {
      sonnerToast.dismiss(`intervention-skip:${reflectionId}`);
      pendingRetryConfirmRef.current = reflectionId;
    }
    fetchedSlotsRef.current = new Set();
    setSignal(null); setSignalError(false);
    setNudge(null); setNudgeError(false);
    setZoomOut(null); setZoomOutError(false);
    setHistoryInsight(null); setHistoryError(false);
    setIntervention(null); setInterventionError(false);
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    setRetryCount(c => c + 1);
  }, [reflectionId]);

  const regenerateCompanion = useCallback(async (slot: RegenerateCompanionSlot) => {
    if (!reflectionId) return;
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
        reflection_prefix: reflectionId.slice(0, 8),
      });

      const { data, error: fnError } = await supabase.functions.invoke('companion-orchestrate', {
        body: {
          holzenInvokeSource: 'browser_regenerate',
          reflectionId,
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
          reflection_prefix: reflectionId.slice(0, 8),
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
          reflection_prefix: reflectionId.slice(0, 8),
          source: r.source,
          latencyMs: r.latencyMs,
          cacheRelaxation: r.cacheRelaxation ?? null,
        });
      } else {
        holzenLog.companion('regenerate empty slot', { slot, reflection_prefix: reflectionId.slice(0, 8) });
        setErr(true);
      }
    } catch (e) {
      console.error('[useCompanionData] regenerateCompanion', e);
      toast({ title: 'Regenerate failed', description: 'Network error', variant: 'destructive' });
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [reflectionId, context, reflectionMessage, mood, severityNumber, language, toast, autoSaveToLibrary, canAccessCompanion]);

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
