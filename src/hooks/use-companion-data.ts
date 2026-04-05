import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import {
  applyOrchestrateSlotLazyOrRegenerate,
  hydrateOrchestrateSlotIfNew,
  isFilledOrchestrateSlot,
  readOrchestrateSlotBody,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
} from '@/lib/companion-orchestrate-slot-apply';
import { saveCompanionLibraryBookmarkOnce } from '@/lib/companion-library-autosave';

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
    fetchedSlotsRef.current = new Set();

    if (!reflectionId) {
      setInterventionLoading(false);
      return;
    }
    setInterventionLoading(true);
  }, [reflectionId]);

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

        // Intervention not cached — fetch from orchestrate (intervention-only, no companion slots)
        const moodHistory = await loadMoodHistoryForOrchestrate();

        const { data, error: fnError } = await supabase.functions.invoke('companion-orchestrate', {
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
        });

        if (cancelled) return;

        const body = data as Record<string, unknown> | null;
        if (!!fnError || !body || Boolean(body.error)) {
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
        );
        hydrateOrchestrateSlotIfNew(
          'history',
          readOrchestrateSlotBody(orchestrateBody, 'history'),
          fetchedSlotsRef.current,
          slotCommitters,
        );
        hydrateOrchestrateSlotIfNew(
          'zoomOut',
          readOrchestrateSlotBody(orchestrateBody, 'zoomOut'),
          fetchedSlotsRef.current,
          slotCommitters,
        );
        hydrateOrchestrateSlotIfNew(
          'signal',
          readOrchestrateSlotBody(orchestrateBody, 'signal'),
          fetchedSlotsRef.current,
          slotCommitters,
        );
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
    fetchedSlotsRef.current.add(slot);

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
        setErr(true);
        setLoading(false);
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
        applyOrchestrateSlotLazyOrRegenerate(slot, r, setCacheIds, slotCommitters);
      } else {
        setErr(true);
      }
    } catch (e) {
      console.error('[useCompanionData] fetchCompanion failed', slot, e);
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [reflectionId, context, reflectionMessage, mood, severityNumber, language, autoSaveToLibrary]);

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
    fetchedSlotsRef.current = new Set();
    setSignal(null); setSignalError(false);
    setNudge(null); setNudgeError(false);
    setZoomOut(null); setZoomOutError(false);
    setHistoryInsight(null); setHistoryError(false);
    setIntervention(null); setInterventionError(false);
    setRetryCount(c => c + 1);
  }, []);

  const regenerateCompanion = useCallback(async (slot: RegenerateCompanionSlot) => {
    if (!reflectionId) return;
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
        const msg = typeof body?.error === 'string' ? body.error : fnError?.message ?? 'Regenerate failed';
        toast({ title: 'Regenerate failed', description: msg, variant: 'destructive' });
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
        applyOrchestrateSlotLazyOrRegenerate(slot, r, setCacheIds, slotCommitters);
      } else {
        setErr(true);
      }
    } catch (e) {
      console.error('[useCompanionData] regenerateCompanion', e);
      toast({ title: 'Regenerate failed', description: 'Network error', variant: 'destructive' });
      setErr(true);
    } finally {
      setLoading(false);
    }
  }, [reflectionId, context, reflectionMessage, mood, severityNumber, language, toast, autoSaveToLibrary]);

  return {
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    cacheIds,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
    intervention, interventionLoading, interventionError,
    retryOrchestrate,
    regenerateCompanion,
    fetchCompanion,
  };
}
