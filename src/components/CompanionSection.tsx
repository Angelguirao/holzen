import { useState, useCallback, useEffect, useRef, forwardRef } from 'react';
import { BreathingExercise } from './BreathingExercise';
import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { SignalDisplay } from './SignalDisplay';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';

export interface CompanionData {
  haiku: string | null;
  learningTitle: string | null;
  learningBody: string | null;
}

export interface CompanionPrefs {
  breathing: boolean;
  haiku: boolean;
  learning: boolean;
  signal: boolean;
  zoomOut: boolean;
  history: boolean;
}

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

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  reflectionId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
}

function CollapsibleCompanion({
  label,
  expanded,
  onToggle,
  completed,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  completed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        {completed ? (
          <Check className="h-3 w-3 shrink-0 text-primary" />
        ) : (
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`}
          />
        )}
        <span className={completed ? 'text-muted-foreground/50' : ''}>{label}</span>
      </button>
      {expanded && (
        <div className="animate-fade-in mt-2 ml-4.5">
          {children}
        </div>
      )}
    </div>
  );
}

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection({ companions, prefs, severity = 'mild', reflectionId, context, reflectionMessage }, ref) {
  const { language } = useHolzen();

  // Helper: auto-save companion to library (dedup by reflection_id + source_type)
  const autoSaveToLibrary = useCallback(async (params: { title: string; body: string; sourceType: string; sourceUrl?: string }) => {
    if (!reflectionId) return;
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
    });
  }, [reflectionId]);

  // Static English labels — language setting only affects AI-generated content
  const t = { pause: 'Pause with this', breathe: 'Breathe with this', haiku: 'Read as haiku', ground: 'Ground yourself', signal: 'Read the signal', zoomOut: 'Zoom out', lookBack: 'Look back' };
  const [expandedBreathing, setExpandedBreathing] = useState(false);
  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(false);
  const [expandedZoomOut, setExpandedZoomOut] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);
  const [completion, setCompletion] = useState<CompletionState>({
    breathing: false,
    haiku: false,
    learning: false,
    signal: false,
    zoomOut: false,
    history: false,
  });

  // Load persisted completion state from DB
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

  // Lift nudge state here so it survives expand/collapse cycles
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);
  const nudgeFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.learning || !reflectionId) return;
    const key = reflectionId;
    if (nudgeFetchedRef.current === key) return;
    nudgeFetchedRef.current = key;

    let cancelled = false;
    setNudgeLoading(true);
    setNudgeError(false);

    supabase
      .from('reflections')
      .select('learning_title, learning_body, learning_citation, learning_url')
      .eq('id', reflectionId)
      .single()
      .then(async ({ data: row }) => {
        if (cancelled) return;
        if (row?.learning_citation) {
          setNudge({
            title: row.learning_title ?? '',
            body: row.learning_body ?? '',
            citation: row.learning_citation,
            url: row.learning_url ?? '',
          });
          setNudgeLoading(false);
          return;
        }

        // Fetch learning sources for ground-nudge
        let learningSources: { name: string; type: string; url?: string }[] = [];
        try {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData?.user?.id;
          if (userId) {
            const [{ data: catalog }, { data: userPrefs }] = await Promise.all([
              supabase.from('signal_sources').select('id, name, type, url, category').eq('category', 'learning'),
              supabase.from('user_signal_preferences').select('source_id, custom_name, custom_url, custom_type, active, category').eq('user_id', userId).eq('category', 'learning'),
            ]);
            const prefsMap = new Map((userPrefs ?? []).map((p: any) => [p.source_id, p]));
            const catalogActive = (catalog ?? []).filter((s: any) => {
              const pref = prefsMap.get(s.id);
              return pref ? pref.active : true;
            }).map((s: any) => ({ name: s.name, type: s.type, url: s.url }));
            const customActive = (userPrefs ?? [])
              .filter((p: any) => !p.source_id && p.custom_name && p.active)
              .map((p: any) => ({ name: p.custom_name, type: p.custom_type || 'blog', url: p.custom_url }));
            learningSources = [...catalogActive, ...customActive];
          }
        } catch { /* non-critical */ }

        supabase.functions
          .invoke('ground-nudge', { body: { context: context ?? '', language, sources: learningSources.length > 0 ? learningSources : undefined } })
          .then(({ data, error: fnError }) => {
            if (cancelled) return;
            if (fnError || !data || data.error) {
              setNudgeError(true);
            } else {
              const nudgeData = data as NudgeData;
              setNudge(nudgeData);
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
  }, [prefs.learning, reflectionId, context]);

  // Signal companion state
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);
  const signalFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reflectionId) return;
    const key = reflectionId;
    if (signalFetchedRef.current === key) return;
    signalFetchedRef.current = key;

    let cancelled = false;
    setSignalLoading(true);
    setSignalError(false);

    supabase
      .from('reflections')
      .select('signal_title, signal_body, signal_source, signal_url')
      .eq('id', reflectionId)
      .single()
      .then(async ({ data: row }) => {
        if (cancelled) return;
        if (row?.signal_source) {
          setSignal({
            title: row.signal_title ?? '',
            body: row.signal_body ?? '',
            source: row.signal_source,
            url: row.signal_url ?? '',
          });
          setSignalLoading(false);
          return;
        }

        // Fetch user's active signal sources (category=signal) to pass to the edge function
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

        supabase.functions
          .invoke('signal-companion', {
            body: {
              context: context ?? '',
              language,
              sources: activeSources.length > 0 ? activeSources : undefined,
            },
          })
          .then(({ data, error: fnError }) => {
            if (cancelled) return;
            if (fnError || !data || data.error) {
              setSignalError(true);
            } else {
              const signalData = data as SignalData;
              setSignal(signalData);
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
  }, [reflectionId, context]);

  // Zoom Out companion state
  const [zoomOut, setZoomOut] = useState<import('./ZoomOutDisplay').ZoomOutData | null>(null);
  const [zoomOutLoading, setZoomOutLoading] = useState(false);
  const [zoomOutError, setZoomOutError] = useState(false);
  const zoomOutFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.zoomOut || !reflectionId) return;
    const key = reflectionId;
    if (zoomOutFetchedRef.current === key) return;
    zoomOutFetchedRef.current = key;

    let cancelled = false;
    setZoomOutLoading(true);
    setZoomOutError(false);

    // Check if already persisted
    supabase
      .from('reflections')
      .select('zoom_out_data')
      .eq('id', reflectionId)
      .single()
      .then(({ data: row }) => {
        if (cancelled) return;
        if ((row as any)?.zoom_out_data) {
          setZoomOut((row as any).zoom_out_data);
          setZoomOutLoading(false);
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
              // Persist
              supabase
                .from('reflections')
                .update({ zoom_out_data: data } as any)
                .eq('id', reflectionId)
                .then(() => {});
              autoSaveToLibrary({ title: 'Zoom Out', body: typeof data === 'object' ? JSON.stringify(data) : String(data), sourceType: 'zoom_out' });
            }
            setZoomOutLoading(false);
          });
      });

    return () => { cancelled = true; };
  }, [prefs.zoomOut, reflectionId, context, reflectionMessage]);

  // Historical Insight companion state
  interface HistoricalInsightData {
    title: string;
    btcInsight: string;
    analogy: string;
    assetClass: string;
    period: string;
  }
  const [historyInsight, setHistoryInsight] = useState<HistoricalInsightData | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const historyFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!prefs.history || !reflectionId) return;
    const key = reflectionId;
    if (historyFetchedRef.current === key) return;
    historyFetchedRef.current = key;

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(false);

    // Check if already persisted
    supabase
      .from('reflections')
      .select('history_insight_data')
      .eq('id', reflectionId)
      .single()
      .then(({ data: row }) => {
        if (cancelled) return;
        if ((row as any)?.history_insight_data) {
          setHistoryInsight((row as any).history_insight_data);
          setHistoryLoading(false);
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
              // Persist
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
  }, [prefs.history, reflectionId, context]);

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

  const hasBreathing = prefs.breathing;
  const hasHaiku = prefs.haiku && companions.haiku;
  const hasLearning = prefs.learning;
  const hasSignal = prefs.signal && !!reflectionId;
  const hasZoomOut = prefs.zoomOut && !!reflectionId;
  const hasHistory = prefs.history && !!reflectionId;

  if (!hasBreathing && !hasHaiku && !hasLearning && !hasSignal && !hasZoomOut && !hasHistory) return null;

  return (
    <div ref={ref} className="space-y-3 pt-2 border-t border-border/40">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">
        {t.pause}
      </p>

      {hasBreathing && (
        <CollapsibleCompanion
          label={t.breathe}
          expanded={expandedBreathing}
          onToggle={() => setExpandedBreathing((v) => !v)}
          completed={completion.breathing}
        >
          <BreathingExercise severity={severity} onComplete={() => markCompleted('breathing')} onClose={() => setExpandedBreathing(false)} autoOpen />
        </CollapsibleCompanion>
      )}

      {hasHaiku && (
        <CollapsibleCompanion
          label={t.haiku}
          expanded={expandedHaiku}
          onToggle={() => {
            setExpandedHaiku((v) => !v);
            if (!completion.haiku) markCompleted('haiku');
          }}
          completed={completion.haiku}
        >
          <HaikuDisplay haiku={companions.haiku!} />
          <div className="mt-1.5"><SaveToLibraryButton title="Haiku" body={companions.haiku!} sourceType="haiku" reflectionId={reflectionId ?? undefined} /></div>
        </CollapsibleCompanion>
      )}

      {hasLearning && (
        <CollapsibleCompanion
          label={t.ground}
          expanded={expandedLearning}
          onToggle={() => {
            setExpandedLearning((v) => !v);
            if (!completion.learning) markCompleted('learning');
          }}
          completed={completion.learning}
        >
          <LearningInput
            title={companions.learningTitle ?? ''}
            body={companions.learningBody ?? ''}
            nudge={nudge}
            nudgeLoading={nudgeLoading}
            nudgeError={nudgeError}
          />
          {nudge && <div className="mt-1.5"><SaveToLibraryButton title={nudge.title} body={nudge.body} sourceType="learning" sourceUrl={nudge.url} reflectionId={reflectionId ?? undefined} /></div>}
        </CollapsibleCompanion>
      )}

      {hasSignal && (
        <CollapsibleCompanion
          label={t.signal}
          expanded={expandedSignal}
          onToggle={() => {
            setExpandedSignal((v) => !v);
            if (!completion.signal) markCompleted('signal');
          }}
          completed={completion.signal}
        >
          <SignalDisplay
            signal={signal}
            loading={signalLoading}
            error={signalError}
          />
          {signal && <div className="mt-1.5"><SaveToLibraryButton title={signal.title} body={signal.body} sourceType="signal" sourceUrl={signal.url} reflectionId={reflectionId ?? undefined} /></div>}
        </CollapsibleCompanion>
      )}

      {hasZoomOut && (
        <CollapsibleCompanion
          label={t.zoomOut}
          expanded={expandedZoomOut}
          onToggle={() => {
            setExpandedZoomOut((v) => !v);
            if (!completion.zoomOut) markCompleted('zoomOut');
          }}
          completed={completion.zoomOut}
        >
          <ZoomOutDisplay
            data={zoomOut}
            loading={zoomOutLoading}
            error={zoomOutError}
          />
          {zoomOut && <div className="mt-1.5"><SaveToLibraryButton title="Zoom Out" body={typeof zoomOut === 'object' ? JSON.stringify(zoomOut) : String(zoomOut)} sourceType="zoom_out" reflectionId={reflectionId ?? undefined} /></div>}
        </CollapsibleCompanion>
      )}

      {hasHistory && (
        <CollapsibleCompanion
          label={t.lookBack}
          expanded={expandedHistory}
          onToggle={() => {
            setExpandedHistory((v) => !v);
            if (!completion.history) markCompleted('history');
          }}
          completed={completion.history}
        >
          <HistoricalInsightDisplay
            data={historyInsight}
            loading={historyLoading}
            error={historyError}
          />
          {historyInsight && <div className="mt-1.5"><SaveToLibraryButton title={historyInsight.title} body={historyInsight.btcInsight} sourceType="history_insight" reflectionId={reflectionId ?? undefined} /></div>}
        </CollapsibleCompanion>
      )}
    </div>
  );
});
