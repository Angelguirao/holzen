import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';

// ── Intervention types (new pause flow) ──────────────────────────────────────

export interface InterventionPrimary {
  type: 'mirror' | 'pattern' | 'trap';
  data: any;
}

export interface InterventionSecondary {
  type: 'zoom_out';
  data: any;
}

export interface InterventionState {
  mode: 'insight' | 'question';
  primary: InterventionPrimary | null;
  secondary: InterventionSecondary | null;
  question: string | null;
}

interface CompletionState {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

interface CacheIds {
  nudge: string | null;
  signal: string | null;
  zoomOut: string | null;
  history: string | null;
}

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

interface HistoricalInsightData {
  title: string;
  btcInsight: string;
  analogy: string;
  assetClass: string;
  period: string;
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

interface CompanionResult {
  data: any | null;
  source: 'live' | 'cache' | 'curated' | 'empty';
  cacheId: string | null;
  latencyMs: number;
  error?: string;
}

export function useCompanionData({ companions, prefs, reflectionId, context, reflectionMessage, mood, severityNumber }: UseCompanionDataParams) {
  const { language } = useHolzen();

  // ── Favorites ──
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!reflectionId) return;
    supabase
      .from('library_items')
      .select('source_type, is_favorite')
      .eq('reflection_id', reflectionId)
      .then(({ data }) => {
        if (!data) return;
        const favs: Record<string, boolean> = {};
        data.forEach((row: any) => {
          if (row.source_type) favs[row.source_type] = row.is_favorite ?? false;
        });
        setFavorites(favs);
      });
  }, [reflectionId]);

  const toggleCompanionFavorite = useCallback(async (sourceType: string) => {
    if (!reflectionId) return;
    const newVal = !favorites[sourceType];
    setFavorites((prev) => ({ ...prev, [sourceType]: newVal }));
    await supabase
      .from('library_items')
      .update({ is_favorite: newVal })
      .eq('reflection_id', reflectionId)
      .eq('source_type', sourceType);
  }, [reflectionId, favorites]);

  // ── Auto-save to library ──
  const savingRef = useRef<Set<string>>(new Set());

  const autoSaveToLibrary = useCallback(async (params: { title: string; body: string; sourceType: string; sourceUrl?: string }) => {
    if (!reflectionId) return;
    const dedupKey = `${reflectionId}:${params.sourceType}`;
    if (savingRef.current.has(dedupKey)) return;
    savingRef.current.add(dedupKey);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;
      const { data: existing } = await supabase
        .from('library_items')
        .select('id')
        .eq('user_id', userId)
        .eq('reflection_id', reflectionId)
        .eq('source_type', params.sourceType)
        .limit(1);
      if (existing && existing.length > 0) return;
      await supabase.from('library_items').insert({
        user_id: userId,
        type: 'bookmark',
        title: params.title,
        body: params.body,
        source_type: params.sourceType,
        source_url: params.sourceUrl || null,
        reflection_id: reflectionId,
        tags: [],
      });
    } finally {
      // Keep the key to prevent future attempts within same component lifecycle
    }
  }, [reflectionId]);

  // ── Completion state ──
  const [completion, setCompletion] = useState<CompletionState>({
    breathing: false, haiku: false, learning: false, signal: false, zoomOut: false, history: false,
  });
  const [cacheIds, setCacheIds] = useState<CacheIds>({ nudge: null, signal: null, zoomOut: null, history: null });

  useEffect(() => {
    if (!reflectionId) return;
    supabase
      .from('reflections')
      .select('breathing_completed, haiku_read, learning_read, signal_read, zoom_out_read, history_read')
      .eq('id', reflectionId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompletion({
            breathing: (data as any).breathing_completed ?? false,
            haiku: (data as any).haiku_read ?? false,
            learning: (data as any).learning_read ?? false,
            signal: (data as any).signal_read ?? false,
            zoomOut: (data as any).zoom_out_read ?? false,
            history: (data as any).history_read ?? false,
          });
        }
      });
  }, [reflectionId]);

  const markCompleted = useCallback(async (key: keyof CompletionState) => {
    if (completion[key]) return;
    setCompletion((prev) => ({ ...prev, [key]: true }));
    hapticFeedback('light');
    if (reflectionId) {
      const dbKeyMap: Record<string, string> = {
        breathing: 'breathing_completed',
        haiku: 'haiku_read',
        learning: 'learning_read',
        signal: 'signal_read',
        zoomOut: 'zoom_out_read',
        history: 'history_read',
      };
      const dbKey = dbKeyMap[key];
      if (dbKey) {
        await supabase
          .from('reflections')
          .update({ [dbKey]: true } as any)
          .eq('id', reflectionId);
      }
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

  const [historyInsight, setHistoryInsight] = useState<HistoricalInsightData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  const fetchedRef = useRef<string | null>(null);

  // ── Intervention state (new pause flow) ──
  const [intervention, setIntervention] = useState<InterventionState | null>(null);
  const [interventionLoading, setInterventionLoading] = useState(false);
  const [interventionError, setInterventionError] = useState(false);

  // ── Check for already-cached data on the reflection row ──
  const checkCachedReflection = useCallback(async (rid: string): Promise<{
    signal?: SignalData | null;
    grounding?: NudgeData | null;
    history?: HistoricalInsightData | null;
    zoomOut?: any;
  }> => {
    const { data: row } = await supabase
      .from('reflections')
      .select('signal_title, signal_body, signal_source, signal_url, learning_title, learning_body, learning_citation, learning_url, zoom_out_data, history_insight_data')
      .eq('id', rid)
      .single();
    if (!row) return {};

    const result: any = {};
    if ((row as any).signal_source) {
      result.signal = { title: (row as any).signal_title ?? '', body: (row as any).signal_body ?? '', source: (row as any).signal_source, url: (row as any).signal_url ?? '' };
    }
    if ((row as any).learning_citation) {
      result.grounding = { title: (row as any).learning_title ?? '', body: (row as any).learning_body ?? '', citation: (row as any).learning_citation, url: (row as any).learning_url ?? '' };
    }
    if ((row as any).history_insight_data) {
      result.history = (row as any).history_insight_data;
    }
    if ((row as any).zoom_out_data) {
      result.zoomOut = (row as any).zoom_out_data;
    }
    return result;
  }, []);

  // ── Get localStorage dedup hints ──
  const getRecencyHints = useCallback(() => {
    const safeGet = (key: string): string[] => {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    };
    return {
      recentSignalSources: safeGet('holzen_recent_signal_sources'),
      recentSignalTitles: safeGet('holzen_recent_signal_titles'),
      recentNudgeTopics: safeGet('holzen_recent_nudge_topics'),
      recentHistoryTitles: safeGet('holzen_recent_history_titles'),
      recentZoomOutTitles: safeGet('holzen_recent_zoom_out_titles'),
    };
  }, []);

  // ── Update localStorage after receiving results ──
  const updateRecencyHints = useCallback((type: string, title: string, source?: string) => {
    if (!title) return;
    const keyMap: Record<string, string> = {
      signal_title: 'holzen_recent_signal_titles',
      signal_source: 'holzen_recent_signal_sources',
      grounding: 'holzen_recent_nudge_topics',
      history: 'holzen_recent_history_titles',
      zoomOut: 'holzen_recent_zoom_out_titles',
    };
    const key = keyMap[type];
    if (!key) return;
    try {
      const prev: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [title, ...prev.filter(s => s !== title)].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, []);

  // ── Get active signal sources ──
  const getSignalSources = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return undefined;
      const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
        supabase.from('signal_sources').select('id, name, type, url, category').eq('category', 'signal'),
        supabase.from('user_signal_preferences').select('source_id, custom_name, custom_url, custom_type, active, category').eq('user_id', userId).eq('category', 'signal'),
      ]);
      const prefsMap = new Map((userPrefs ?? []).map((p: any) => [p.source_id, p]));
      const catalogActive = (catalog ?? []).filter((s: any) => {
        const pref = prefsMap.get(s.id);
        return pref ? pref.active : true;
      }).map((s: any) => ({ name: s.name, type: s.type, url: s.url }));
      const customActive = (userPrefs ?? [])
        .filter((p: any) => !p.source_id && p.custom_name && p.active)
        .map((p: any) => ({ name: p.custom_name, type: p.custom_type || 'blog', url: p.custom_url }));
      const sources = [...catalogActive, ...customActive];
      return sources.length > 0 ? sources : undefined;
    } catch { return undefined; }
  }, []);

  // ── Main orchestrated fetch ──
  useEffect(() => {
    if (!reflectionId) return;

    const enableSignal = prefs.signal;
    const enableGrounding = prefs.learning;
    const enableHistory = prefs.history;
    const enableZoomOut = prefs.zoomOut;

    // Always fire — intervention selection runs regardless of companion prefs.
    // Individual prefs control which legacy companions are additionally generated.

    const key = `${reflectionId}:${retryCount}`;
    if (fetchedRef.current === key) return;
    fetchedRef.current = key;

    let cancelled = false;

    // Set loading states
    if (enableSignal) setSignalLoading(true);
    if (enableGrounding) setNudgeLoading(true);
    if (enableHistory) setHistoryLoading(true);
    if (enableZoomOut) setZoomOutLoading(true);
    setInterventionLoading(true);

    setSignalError(false);
    setNudgeError(false);
    setHistoryError(false);
    setZoomOutError(false);
    setInterventionError(false);

    (async () => {
      // First check if reflection already has cached data
      const cached = await checkCachedReflection(reflectionId);

      if (cancelled) return;

      // Determine which companions still need fetching
      const needSignal = enableSignal && !cached.signal;
      const needGrounding = enableGrounding && !cached.grounding;
      const needHistory = enableHistory && !cached.history;
      const needZoomOut = enableZoomOut && !cached.zoomOut;

      // Set already-cached companions immediately
      if (cached.signal && enableSignal) {
        setSignal(cached.signal);
        setSignalLoading(false);
        autoSaveToLibrary({ title: cached.signal.title, body: cached.signal.body, sourceType: 'signal', sourceUrl: cached.signal.url });
      }
      if (cached.grounding && enableGrounding) {
        setNudge(cached.grounding);
        setNudgeLoading(false);
        autoSaveToLibrary({ title: cached.grounding.title, body: cached.grounding.body, sourceType: 'learning', sourceUrl: cached.grounding.url });
      }
      if (cached.history && enableHistory) {
        setHistoryInsight(cached.history);
        setHistoryLoading(false);
        autoSaveToLibrary({ title: cached.history.title, body: cached.history.btcInsight, sourceType: 'history_insight' });
      }
      if (cached.zoomOut && enableZoomOut) {
        setZoomOut(cached.zoomOut);
        setZoomOutLoading(false);
        const zoomBody = cached.zoomOut?.deepTime?.body || cached.zoomOut?.echo?.message || 'Zoom Out perspective';
        autoSaveToLibrary({ title: cached.zoomOut?.deepTime?.title || 'Zoom Out', body: zoomBody, sourceType: 'zoom_out' });
      }

      // If nothing needs fetching, done
      if (!needSignal && !needGrounding && !needHistory && !needZoomOut) return;

      // Build orchestrator payload
      const recency = getRecencyHints();
      const signalSources = needSignal ? await getSignalSources() : undefined;

      // Fetch recent mood history from DB for intervention selection
      let moodHistory: Array<{ mood: string; outcome?: string | null }> = [];
      try {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (uid) {
          const { data: recentRows } = await supabase
            .from('reflections')
            .select('mood, outcome')
            .eq('user_id', uid)
            .not('mood', 'is', null)
            .order('created_at', { ascending: false })
            .limit(20);
          if (recentRows) {
            moodHistory = recentRows
              .filter((r: any) => r.mood)
              .map((r: any) => ({ mood: r.mood, outcome: r.outcome ?? null }));
          }
        }
      } catch { /* non-fatal */ }

      const { data, error: fnError } = await supabase.functions.invoke('companion-orchestrate', {
        body: {
          reflectionId,
          context: context ?? '',
          language,
          reflectionMessage: reflectionMessage ?? '',
          mood: mood ?? null,
          severity: severityNumber ?? 0,
          moodHistory,
          signalSources,
          ...recency,
          enableSignal: needSignal,
          enableGrounding: needGrounding,
          enableHistory: needHistory,
          enableZoomOut: needZoomOut,
          // Always request intervention selection in the pause flow
          useIntervention: true,
        },
      });

      if (cancelled) return;

      if (fnError || !data) {
        if (needSignal) { setSignalError(true); setSignalLoading(false); }
        if (needGrounding) { setNudgeError(true); setNudgeLoading(false); }
        if (needHistory) { setHistoryError(true); setHistoryLoading(false); }
        if (needZoomOut) { setZoomOutError(true); setZoomOutLoading(false); }
        setInterventionError(true);
        setInterventionLoading(false);
        return;
      }

      // Process intervention (new pause flow)
      if (data.intervention) {
        setIntervention(data.intervention as InterventionState);
      } else {
        setInterventionError(true);
      }
      setInterventionLoading(false);

      // Process signal
      if (needSignal) {
        const r = data.signal as CompanionResult | null;
        if (r?.data && r.source !== 'empty') {
          setSignal(r.data as SignalData);
          if (r.cacheId) setCacheIds(prev => ({ ...prev, signal: r.cacheId }));
          updateRecencyHints('signal_title', r.data.title);
          updateRecencyHints('signal_source', r.data.source);
          autoSaveToLibrary({ title: r.data.title, body: r.data.body, sourceType: 'signal', sourceUrl: r.data.url });
        } else {
          setSignalError(true);
        }
        setSignalLoading(false);
      }

      // Process grounding
      if (needGrounding) {
        const r = data.grounding as CompanionResult | null;
        if (r?.data && r.source !== 'empty') {
          setNudge(r.data as NudgeData);
          if (r.cacheId) setCacheIds(prev => ({ ...prev, nudge: r.cacheId }));
          updateRecencyHints('grounding', r.data.title);
          autoSaveToLibrary({ title: r.data.title, body: r.data.body, sourceType: 'learning', sourceUrl: r.data.url });
        } else {
          setNudgeError(true);
        }
        setNudgeLoading(false);
      }

      // Process history
      if (needHistory) {
        const r = data.history as CompanionResult | null;
        if (r?.data && r.source !== 'empty') {
          setHistoryInsight(r.data as HistoricalInsightData);
          if (r.cacheId) setCacheIds(prev => ({ ...prev, history: r.cacheId }));
          updateRecencyHints('history', r.data.title);
          autoSaveToLibrary({ title: r.data.title, body: r.data.btcInsight, sourceType: 'history_insight' });
        } else {
          setHistoryError(true);
        }
        setHistoryLoading(false);
      }

      // Process zoomOut
      if (needZoomOut) {
        const r = data.zoomOut as CompanionResult | null;
        if (r?.data && r.source !== 'empty') {
          setZoomOut(r.data);
          if (r.cacheId) setCacheIds(prev => ({ ...prev, zoomOut: r.cacheId }));
          updateRecencyHints('zoomOut', r.data?.deepTime?.title);
          const zoomBody = r.data?.deepTime?.body || r.data?.echo?.message || 'Zoom Out perspective';
          autoSaveToLibrary({ title: r.data?.deepTime?.title || 'Zoom Out', body: zoomBody, sourceType: 'zoom_out' });
        } else {
          setZoomOutError(true);
        }
        setZoomOutLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [reflectionId, retryCount, prefs.signal, prefs.learning, prefs.history, prefs.zoomOut, context, reflectionMessage]);

  // ── Retry helpers ──
  const retryNudge = useCallback(() => { setRetryCount(c => c + 1); }, []);
  const retrySignal = useCallback(() => { setRetryCount(c => c + 1); }, []);
  const retryZoomOut = useCallback(() => { setRetryCount(c => c + 1); }, []);
  const retryHistory = useCallback(() => { setRetryCount(c => c + 1); }, []);

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
  };
}
