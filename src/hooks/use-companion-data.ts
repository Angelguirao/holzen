import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';

interface CompletionState {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
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
}

export function useCompanionData({ companions, prefs, reflectionId, context, reflectionMessage }: UseCompanionDataParams) {
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

  // ── Poll helper ──
  const pollForCachedData = useCallback(async (
    rid: string,
    fields: string,
    checkFn: (row: any) => boolean,
    maxAttempts = 3,
  ): Promise<any | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 2000));
      const { data: row } = await supabase.from('reflections').select(fields).eq('id', rid).single();
      if (row && checkFn(row)) return row;
    }
    return null;
  }, []);

  // ── Nudge (Grounding) ──
  const [nudgeRetry, setNudgeRetry] = useState(0);
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);
  const nudgeFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.learning || !reflectionId) return;
    const key = reflectionId;
    if (nudgeFetchedRef.current === key && nudgeRetry === 0) return;
    nudgeFetchedRef.current = key;

    let cancelled = false;
    setNudgeLoading(true);
    setNudgeError(false);

    pollForCachedData(
      reflectionId,
      'learning_title, learning_body, learning_citation, learning_url',
      (row) => !!row?.learning_citation,
    ).then(async (row) => {
      if (cancelled) return;
      if (row?.learning_citation) {
        const cachedNudge = {
          title: row.learning_title ?? '',
          body: row.learning_body ?? '',
          citation: row.learning_citation,
          url: row.learning_url ?? '',
        };
        setNudge(cachedNudge);
        setNudgeLoading(false);
        autoSaveToLibrary({ title: cachedNudge.title, body: cachedNudge.body, sourceType: 'learning', sourceUrl: cachedNudge.url });
        return;
      }

      // Pass recent bias topics to avoid repetition
      let recentTopics: string[] = [];
      try {
        const stored = localStorage.getItem('holzen_recent_nudge_topics');
        if (stored) recentTopics = JSON.parse(stored);
      } catch { /* ignore */ }

      supabase.functions
        .invoke('ground-nudge', { body: { context: context ?? '', language, recentTopics } })
        .then(({ data, error: fnError }) => {
          if (cancelled) return;
          if (fnError || !data || data.error) {
            setNudgeError(true);
          } else {
            const nudgeData = data as NudgeData;
            setNudge(nudgeData);
            // Track topic for cross-session dedup
            try {
              const prev: string[] = JSON.parse(localStorage.getItem('holzen_recent_nudge_topics') || '[]');
              if (nudgeData.title) {
                prev.unshift(nudgeData.title);
                localStorage.setItem('holzen_recent_nudge_topics', JSON.stringify(prev.slice(0, 5)));
              }
            } catch { /* ignore */ }
            supabase
              .from('reflections')
              .update({
                learning_title: nudgeData.title,
                learning_body: nudgeData.body,
                learning_citation: nudgeData.citation,
                learning_url: nudgeData.url,
              } as any)
              .eq('id', reflectionId)
              .then(() => {});
            autoSaveToLibrary({ title: nudgeData.title, body: nudgeData.body, sourceType: 'learning', sourceUrl: nudgeData.url });
          }
          setNudgeLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [prefs.learning, reflectionId, context, nudgeRetry]);

  const retryNudge = useCallback(() => { nudgeFetchedRef.current = null; setNudgeRetry(c => c + 1); }, []);

  // ── Signal ──
  const [signalRetry, setSignalRetry] = useState(0);
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);
  const signalFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.signal || !reflectionId) return;
    const key = reflectionId;
    if (signalFetchedRef.current === key && signalRetry === 0) return;
    signalFetchedRef.current = key;

    let cancelled = false;
    setSignalLoading(true);
    setSignalError(false);

    pollForCachedData(
      reflectionId,
      'signal_title, signal_body, signal_source, signal_url',
      (row) => !!row?.signal_source,
    ).then(async (row) => {
      if (cancelled) return;
      if (row?.signal_source) {
        const cachedSignal = {
          title: row.signal_title ?? '',
          body: row.signal_body ?? '',
          source: row.signal_source,
          url: row.signal_url ?? '',
        };
        setSignal(cachedSignal);
        setSignalLoading(false);
        autoSaveToLibrary({ title: cachedSignal.title, body: cachedSignal.body, sourceType: 'signal', sourceUrl: cachedSignal.url });
        return;
      }

      let activeSources: { name: string; type: string; url?: string }[] = [];
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (userId) {
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
          activeSources = [...catalogActive, ...customActive];
        }
      } catch { /* non-critical */ }

      let recentSignalSources: string[] = [];
      let recentSignalTitles: string[] = [];
      try {
        recentSignalSources = JSON.parse(localStorage.getItem('holzen_recent_signal_sources') || '[]');
        recentSignalTitles = JSON.parse(localStorage.getItem('holzen_recent_signal_titles') || '[]');
      } catch { /* ignore */ }

      supabase.functions
        .invoke('signal-companion', {
          body: {
            context: context ?? '',
            language,
            sources: activeSources.length > 0 ? activeSources : undefined,
            recentSignalSources,
            recentSignalTitles,
          },
        })
        .then(({ data, error: fnError }) => {
          if (cancelled) return;
          if (fnError || !data || data.error) {
            setSignalError(true);
          } else {
            const signalData = data as SignalData;
            setSignal(signalData);

            if (signalData.source) {
              try {
                const recent = JSON.parse(localStorage.getItem('holzen_recent_signal_sources') || '[]');
                const updated = [signalData.source, ...recent.filter((s: string) => s !== signalData.source)].slice(0, 5);
                localStorage.setItem('holzen_recent_signal_sources', JSON.stringify(updated));
              } catch { /* ignore */ }
            }

            supabase
              .from('reflections')
              .update({
                signal_title: signalData.title,
                signal_body: signalData.body,
                signal_source: signalData.source,
                signal_url: signalData.url,
              } as any)
              .eq('id', reflectionId)
              .then(() => {});
            autoSaveToLibrary({ title: signalData.title, body: signalData.body, sourceType: 'signal', sourceUrl: signalData.url });
          }
          setSignalLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [prefs.signal, reflectionId, context, signalRetry]);

  const retrySignal = useCallback(() => { signalFetchedRef.current = null; setSignalRetry(c => c + 1); }, []);

  // ── Zoom Out ──
  const [zoomOutRetry, setZoomOutRetry] = useState(0);
  const [zoomOut, setZoomOut] = useState<any>(null);
  const [zoomOutLoading, setZoomOutLoading] = useState(false);
  const [zoomOutError, setZoomOutError] = useState(false);
  const zoomOutFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.zoomOut || !reflectionId) return;
    const key = reflectionId;
    if (zoomOutFetchedRef.current === key && zoomOutRetry === 0) return;
    zoomOutFetchedRef.current = key;

    let cancelled = false;
    setZoomOutLoading(true);
    setZoomOutError(false);

    pollForCachedData(
      reflectionId,
      'zoom_out_data',
      (row) => !!(row as any)?.zoom_out_data,
    ).then((row) => {
      if (cancelled) return;
      if ((row as any)?.zoom_out_data) {
        const zoomData = (row as any).zoom_out_data;
        setZoomOut(zoomData);
        setZoomOutLoading(false);
        const zoomBody = zoomData?.deepTime?.body || zoomData?.echo?.message || 'Zoom Out perspective';
        autoSaveToLibrary({ title: zoomData?.deepTime?.title || 'Zoom Out', body: zoomBody, sourceType: 'zoom_out' });
        return;
      }

      supabase.functions
        .invoke('zoom-out-companion', { body: { context: context ?? '', reflectionMessage: reflectionMessage ?? '', language } })
        .then(({ data, error: fnError }) => {
          if (cancelled) return;
          if (fnError || !data || data.error) {
            setZoomOutError(true);
          } else {
            setZoomOut(data as any);
            supabase
              .from('reflections')
              .update({ zoom_out_data: data } as any)
              .eq('id', reflectionId)
              .then(() => {});
            const zoomBody = (data as any)?.deepTime?.body || (data as any)?.echo?.message || 'Zoom Out perspective';
            autoSaveToLibrary({ title: (data as any)?.deepTime?.title || 'Zoom Out', body: zoomBody, sourceType: 'zoom_out' });
          }
          setZoomOutLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [prefs.zoomOut, reflectionId, context, reflectionMessage, zoomOutRetry]);

  const retryZoomOut = useCallback(() => { zoomOutFetchedRef.current = null; setZoomOutRetry(c => c + 1); }, []);

  // ── Historical Insight ──
  const [historyRetry, setHistoryRetry] = useState(0);
  const [historyInsight, setHistoryInsight] = useState<HistoricalInsightData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const historyFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.history || !reflectionId) return;
    const key = reflectionId;
    if (historyFetchedRef.current === key && historyRetry === 0) return;
    historyFetchedRef.current = key;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(false);

    pollForCachedData(
      reflectionId,
      'history_insight_data',
      (row) => !!(row as any)?.history_insight_data,
    ).then((row) => {
      if (cancelled) return;
      if ((row as any)?.history_insight_data) {
        const cachedHistory = (row as any).history_insight_data as HistoricalInsightData;
        setHistoryInsight(cachedHistory);
        setHistoryLoading(false);
        autoSaveToLibrary({ title: cachedHistory.title, body: cachedHistory.btcInsight, sourceType: 'history_insight' });
        return;
      }

      supabase.functions
        .invoke('historical-insight', { body: { context: context ?? '', language } })
        .then(({ data, error: fnError }) => {
          if (cancelled) return;
          if (fnError || !data || data.error) {
            setHistoryError(true);
          } else {
            setHistoryInsight(data as HistoricalInsightData);
            supabase
              .from('reflections')
              .update({ history_insight_data: data } as any)
              .eq('id', reflectionId)
              .then(() => {});
            autoSaveToLibrary({ title: (data as HistoricalInsightData).title, body: (data as HistoricalInsightData).btcInsight, sourceType: 'history_insight' });
          }
          setHistoryLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [prefs.history, reflectionId, context, historyRetry]);

  const retryHistory = useCallback(() => { historyFetchedRef.current = null; setHistoryRetry(c => c + 1); }, []);

  return {
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    nudge, nudgeLoading, nudgeError, retryNudge,
    signal, signalLoading, signalError, retrySignal,
    zoomOut, zoomOutLoading, zoomOutError, retryZoomOut,
    historyInsight, historyLoading, historyError, retryHistory,
  };
}
