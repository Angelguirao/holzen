import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Existing types ──

interface CacheHitRow {
  companion_type: string | null;
  total_serves: number | null;
  cache_hits: number | null;
  live_generated: number | null;
  curated_fallbacks: number | null;
  cache_hit_pct: number | null;
}

interface CostRow {
  day: string | null;
  companion_type: string | null;
  attempts: number | null;
  total_cost_usd: number | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
}

interface FailureRow {
  companion_type: string | null;
  provider: string | null;
  model: string | null;
  total_attempts: number | null;
  successes: number | null;
  errors: number | null;
  timeouts: number | null;
  quality_gate_failures: number | null;
  failure_pct: number | null;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
}

interface FeedbackRow {
  companion_type: string | null;
  total_thumbs_up: number | null;
  total_thumbs_down: number | null;
  items_with_feedback: number | null;
  approval_pct: number | null;
}

export interface CacheEntryRow {
  id: string;
  companion_type: string;
  title: string | null;
  quality_score: number;
  used_count: number;
  expires_at: string | null;
  thumbs_up: number | null;
  thumbs_down: number | null;
  created_at: string;
  content: any;
}

export interface SignalSourceRow {
  id: string;
  name: string;
  type: string;
  url: string | null;
  category: string;
}

// ── New types for dashboard improvements ──

export type TimePeriod = 'today' | '7d' | '30d' | 'all';

export interface RejectionRow {
  id: string;
  companion_type: string;
  model: string;
  quality_gate_reason: string | null;
  error_message: string | null;
  status: string;
  created_at: string;
  latency_ms: number | null;
}

export interface RecentContentRow {
  id: string;
  companion_type: string;
  content: any;
  quality_score: number;
  title: string | null;
  created_at: string;
  used_count: number;
  source_author: string | null;
}

export interface SessionRow {
  id: string;
  created_at: string;
  message: string;
  context: string | null;
  mood: string | null;
  outcome: string | null;
  signal_title: string | null;
  learning_title: string | null;
  history_insight_data: any;
  zoom_out_data: any;
  haiku: string | null;
}

export interface PeriodStats {
  serves: number;
  cost: number;
  failures: number;
  totalAttempts: number;
  feedbackUp: number;
  feedbackDown: number;
}

export interface AdminStats {
  // View-based data (all-time aggregates)
  cacheHits: CacheHitRow[];
  costs: CostRow[];
  failures: FailureRow[];
  feedback: FeedbackRow[];
  cacheEntries: CacheEntryRow[];
  signalSources: SignalSourceRow[];
  // Period-filtered data
  period: TimePeriod;
  setPeriod: (p: TimePeriod) => void;
  periodStats: PeriodStats;
  prevPeriodStats: PeriodStats | null; // for trend comparison
  // New feeds
  rejections: RejectionRow[];
  recentContent: RecentContentRow[];
  sessions: SessionRow[];
  // State
  loading: boolean;
  error: string | null;
  refresh: () => void;
  refreshCacheEntries: () => Promise<void>;
  lastUpdated: Date | null;
}

function periodToMs(period: TimePeriod): number | null {
  switch (period) {
    case 'today': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    case 'all': return null;
  }
}

function periodStart(period: TimePeriod): string | null {
  const ms = periodToMs(period);
  if (!ms) return null;
  return new Date(Date.now() - ms).toISOString();
}

export function useAdminStats(): AdminStats {
  const [cacheHits, setCacheHits] = useState<CacheHitRow[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [failures, setFailures] = useState<FailureRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntryRow[]>([]);
  const [signalSources, setSignalSources] = useState<SignalSourceRow[]>([]);
  const [rejections, setRejections] = useState<RejectionRow[]>([]);
  const [recentContent, setRecentContent] = useState<RecentContentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [periodStats, setPeriodStats] = useState<PeriodStats>({ serves: 0, cost: 0, failures: 0, totalAttempts: 0, feedbackUp: 0, feedbackDown: 0 });
  const [prevPeriodStats, setPrevPeriodStats] = useState<PeriodStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCacheEntries = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('companion_cache')
      .select('id, companion_type, title, quality_score, used_count, expires_at, thumbs_up, thumbs_down, created_at, content')
      .order('quality_score', { ascending: false })
      .order('used_count', { ascending: false })
      .limit(200);
    if (!err) setCacheEntries((data ?? []) as CacheEntryRow[]);
  }, []);

  const fetchPeriodData = useCallback(async (p: TimePeriod) => {
    const start = periodStart(p);
    const ms = periodToMs(p);

    // Current period stats from companion_serves
    let servesQuery = supabase.from('companion_serves').select('id, serve_source', { count: 'exact', head: true });
    if (start) servesQuery = servesQuery.gte('created_at', start);
    const { count: servesCount } = await servesQuery;

    // Cost from generation_attempts
    let costQuery = supabase.from('generation_attempts').select('estimated_cost_usd');
    if (start) costQuery = costQuery.gte('created_at', start);
    const { data: costData } = await costQuery;
    const totalCost = (costData ?? []).reduce((s: number, r: any) => s + (r.estimated_cost_usd || 0), 0);

    // Failures
    let failQuery = supabase.from('generation_attempts').select('status', { count: 'exact', head: true }).in('status', ['error', 'timeout']);
    if (start) failQuery = failQuery.gte('created_at', start);
    const { count: failCount } = await failQuery;

    let totalQuery = supabase.from('generation_attempts').select('id', { count: 'exact', head: true });
    if (start) totalQuery = totalQuery.gte('created_at', start);
    const { count: totalCount } = await totalQuery;

    // Feedback
    let fbUpQuery = supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event', 'companion_feedback').contains('metadata', { vote: 'up' } as any);
    if (start) fbUpQuery = fbUpQuery.gte('created_at', start);
    const { count: fbUp } = await fbUpQuery;

    let fbDownQuery = supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event', 'companion_feedback').contains('metadata', { vote: 'down' } as any);
    if (start) fbDownQuery = fbDownQuery.gte('created_at', start);
    const { count: fbDown } = await fbDownQuery;

    const current: PeriodStats = {
      serves: servesCount ?? 0,
      cost: totalCost,
      failures: failCount ?? 0,
      totalAttempts: totalCount ?? 0,
      feedbackUp: fbUp ?? 0,
      feedbackDown: fbDown ?? 0,
    };
    setPeriodStats(current);

    // Previous period for comparison (same duration, earlier window)
    if (ms) {
      const prevStart = new Date(Date.now() - ms * 2).toISOString();
      const prevEnd = start!;

      const { count: prevServes } = await supabase.from('companion_serves').select('id', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd);
      const { data: prevCostData } = await supabase.from('generation_attempts').select('estimated_cost_usd').gte('created_at', prevStart).lt('created_at', prevEnd);
      const prevCost = (prevCostData ?? []).reduce((s: number, r: any) => s + (r.estimated_cost_usd || 0), 0);
      const { count: prevFails } = await supabase.from('generation_attempts').select('id', { count: 'exact', head: true }).in('status', ['error', 'timeout']).gte('created_at', prevStart).lt('created_at', prevEnd);
      const { count: prevTotal } = await supabase.from('generation_attempts').select('id', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', prevEnd);

      setPrevPeriodStats({
        serves: prevServes ?? 0,
        cost: prevCost,
        failures: prevFails ?? 0,
        totalAttempts: prevTotal ?? 0,
        feedbackUp: 0,
        feedbackDown: 0,
      });
    } else {
      setPrevPeriodStats(null);
    }
  }, []);

  const fetchFeeds = useCallback(async () => {
    // Quality gate rejections (last 50)
    const { data: rejectData } = await supabase
      .from('generation_attempts')
      .select('id, companion_type, model, quality_gate_reason, error_message, status, created_at, latency_ms')
      .in('status', ['quality_gate_failed', 'error', 'timeout'])
      .order('created_at', { ascending: false })
      .limit(50);
    setRejections((rejectData ?? []) as RejectionRow[]);

    // Recent generated content (last 20 cache entries by creation date)
    const { data: contentData } = await supabase
      .from('companion_cache')
      .select('id, companion_type, content, quality_score, title, created_at, used_count, source_author')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecentContent((contentData ?? []) as RecentContentRow[]);

    // Recent sessions (last 20 reflections)
    const { data: sessionData } = await supabase
      .from('reflections')
      .select('id, created_at, message, context, mood, outcome, signal_title, learning_title, history_insight_data, zoom_out_data, haiku')
      .order('created_at', { ascending: false })
      .limit(20);
    setSessions((sessionData ?? []) as SessionRow[]);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [cacheRes, costRes, failRes, feedRes] = await Promise.all([
        supabase.from('v_companion_cache_hit_rate').select('*'),
        supabase.from('v_companion_cost_per_day').select('*').order('day', { ascending: false }).limit(100),
        supabase.from('v_generation_failure_rate').select('*'),
        supabase.from('v_companion_feedback_ratio').select('*'),
      ]);

      if (cacheRes.error) throw new Error(`Cache hits: ${cacheRes.error.message}`);
      if (costRes.error) throw new Error(`Costs: ${costRes.error.message}`);
      if (failRes.error) throw new Error(`Failures: ${failRes.error.message}`);
      if (feedRes.error) throw new Error(`Feedback: ${feedRes.error.message}`);

      setCacheHits((cacheRes.data ?? []) as CacheHitRow[]);
      setCosts((costRes.data ?? []) as CostRow[]);
      setFailures((failRes.data ?? []) as FailureRow[]);
      setFeedback((feedRes.data ?? []) as FeedbackRow[]);

      await Promise.all([
        fetchCacheEntries(),
        fetchPeriodData(period),
        fetchFeeds(),
      ]);

      const sourcesRes = await supabase
        .from('signal_sources')
        .select('id, name, type, url, category')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (!sourcesRes.error) setSignalSources((sourcesRes.data ?? []) as SignalSourceRow[]);

      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [fetchCacheEntries, fetchPeriodData, fetchFeeds, period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Re-fetch period data when period changes
  const handleSetPeriod = useCallback((p: TimePeriod) => {
    setPeriod(p);
    fetchPeriodData(p);
  }, [fetchPeriodData]);

  return {
    cacheHits, costs, failures, feedback, cacheEntries, signalSources,
    period, setPeriod: handleSetPeriod, periodStats, prevPeriodStats,
    rejections, recentContent, sessions,
    loading, error, refresh: fetchAll, refreshCacheEntries: fetchCacheEntries, lastUpdated,
  };
}
