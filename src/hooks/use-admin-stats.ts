import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Existing types ──

interface CacheHitRow {
  companion_type: string | null;
  total_serves: number | null;
  cache_hits: number | null;
  /** Added in migration `20260418120000_companion_serves_allow_library_source`; may be undefined
   *  until Supabase regenerates types.ts. */
  library_hits: number | null;
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
  rate_limited: number | null;
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
  /** When true, pool selection prefers other rows first (body kept). */
  source_untrusted?: boolean | null;
}

export interface SignalSourceRow {
  id: string;
  name: string;
  type: string;
  url: string | null;
  category: string;
  demoted_for_live?: boolean | null;
  /** Set by fetch-source-feeds after each successful source pass */
  last_fetch_feeds_at?: string | null;
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
  signal_source: string | null;
  grounding_title: string | null;
  history_insight_data: any;
  zoom_out_data: any;
  haiku: string | null;
  /** From companion_serves (admin RLS); null for non-admins or pre-tracking rows */
  serve_source_signal?: string | null;
  serve_source_ground_nudge?: string | null;
  serve_source_historical_insight?: string | null;
  serve_source_zoom_out?: string | null;
}

export interface LibraryEntryRow {
  id: string;
  type: string;
  title: string;
  author: string | null;
  summary: string;
  url: string | null;
  original_url?: string | null;
  original_publication?: string | null;
  tags: string[];
  companion_types: string[];
  quality_score: number;
  active: boolean;
  created_at: string;
}

export interface PeriodStats {
  serves: number;
  cacheHits: number;
  cacheHitRate: number;
  cost: number;
  failures: number;
  totalAttempts: number;
  feedbackUp: number;
  feedbackDown: number;
}

/**
 * Notification response-rate summary for the currently selected admin period.
 * Sourced from v_notification_response_rate (see migration
 * 20260420220000_reflection_source_and_engagement_views.sql). Engagement
 * definitions match src/lib/engaged-pause.ts — ignored notifications are an
 * explicit counter here, never silently folded into behavioural scores.
 */
export interface NotificationResponseStats {
  notifications: number;
  completed: number;
  engaged: number;
  ignored: number;
  /** 0–100, integer. null when no notifications were sent. */
  pctCompleted: number | null;
  pctEngaged: number | null;
  pctIgnored: number | null;
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
  /** Notification response rate over the selected period. */
  notificationStats: NotificationResponseStats;
  // New feeds
  rejections: RejectionRow[];
  recentContent: RecentContentRow[];
  sessions: SessionRow[];
  libraryEntries: LibraryEntryRow[];
  // State
  loading: boolean;
  error: string | null;
  refresh: () => void;
  refreshCacheEntries: () => Promise<void>;
  /** Refetch cache list + “New items” feed without full dashboard loading state */
  refreshCompanionCacheUi: () => Promise<void>;
  /** Refetch Generation failures list (last 50) without full dashboard load */
  refreshRejections: () => Promise<void>;
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
  if (period === 'today') {
    // Today means just today's date (not last 24h)
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  const ms = periodToMs(period);
  if (!ms) return null;
  return new Date(Date.now() - ms).toISOString();
}

export function useAdminStats(enabled = true): AdminStats {
  const [cacheHits, setCacheHits] = useState<CacheHitRow[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [failures, setFailures] = useState<FailureRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [cacheEntries, setCacheEntries] = useState<CacheEntryRow[]>([]);
  const [signalSources, setSignalSources] = useState<SignalSourceRow[]>([]);
  const [rejections, setRejections] = useState<RejectionRow[]>([]);
  const [recentContent, setRecentContent] = useState<RecentContentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntryRow[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [periodStats, setPeriodStats] = useState<PeriodStats>({ serves: 0, cacheHits: 0, cacheHitRate: 0, cost: 0, failures: 0, totalAttempts: 0, feedbackUp: 0, feedbackDown: 0 });
  const [prevPeriodStats, setPrevPeriodStats] = useState<PeriodStats | null>(null);
  // Daily rows from v_notification_response_rate — filtered client-side by period.
  const [notificationPerDay, setNotificationPerDay] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationResponseStats>({
    notifications: 0, completed: 0, engaged: 0, ignored: 0,
    pctCompleted: null, pctEngaged: null, pctIgnored: null,
  });
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

  const refreshCompanionCacheUi = useCallback(async () => {
    await fetchCacheEntries();
    const { data: contentData } = await supabase
      .from('companion_cache')
      .select('id, companion_type, content, quality_score, title, created_at, used_count, source_author')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecentContent((contentData ?? []) as RecentContentRow[]);
  }, [fetchCacheEntries]);

  // Store daily view data for period filtering
  const [servesPerDay, setServesPerDay] = useState<any[]>([]);
  const [failuresPerDay, setFailuresPerDay] = useState<any[]>([]);
  const [feedbackPerDay, setFeedbackPerDay] = useState<any[]>([]);

  /**
   * Compute period stats from daily views (client-side filtering).
   * Uses the new v_companion_serves_per_day, v_generation_failures_per_day,
   * and v_companion_feedback_per_day views (after running the migration).
   * Falls back to all-time view data if daily views return empty.
   */
  const computePeriodStats = useCallback((
    p: TimePeriod,
    costsData: CostRow[],
    cacheHitsData: CacheHitRow[],
    failuresData: FailureRow[],
    feedbackData: FeedbackRow[],
    dailyServes: any[],
    dailyFailures: any[],
    dailyFeedback: any[],
    dailyNotifications: any[],
  ) => {
    const start = periodStart(p);
    const startDate = start?.slice(0, 10);

    // ── Serves + Cache Hit Rate (from daily view, or fall back to all-time) ──
    let totalServes: number;
    let totalCacheHits: number;
    if (dailyServes.length > 0) {
      const filtered = startDate
        ? dailyServes.filter((r: any) => r.day && r.day >= startDate)
        : dailyServes;
      totalServes = filtered.reduce((s: number, r: any) => s + (r.serve_count ?? 0), 0);
      totalCacheHits = filtered
        .filter((r: any) => r.serve_source === 'cache')
        .reduce((s: number, r: any) => s + (r.serve_count ?? 0), 0);
    } else {
      totalServes = cacheHitsData.reduce((s, r) => s + (r.total_serves ?? 0), 0);
      totalCacheHits = cacheHitsData.reduce((s, r) => s + (r.cache_hits ?? 0), 0);
    }
    const cacheHitRate = totalServes > 0 ? Math.round((totalCacheHits / totalServes) * 100) : 0;

    // ── Cost (from costs view — always has daily granularity) ──
    const filteredCosts = startDate
      ? costsData.filter(r => r.day && r.day >= startDate)
      : costsData;
    const totalCost = filteredCosts.reduce((s, r) => s + (r.total_cost_usd ?? 0), 0);

    // ── Failures (from daily view, or fall back to all-time) ──
    let totalFails: number;
    let totalAttempts: number;
    if (dailyFailures.length > 0) {
      const filtered = startDate
        ? dailyFailures.filter((r: any) => r.day && r.day >= startDate)
        : dailyFailures;
      totalFails = filtered
        .filter((r: any) => r.status === 'error' || r.status === 'timeout')
        .reduce((s: number, r: any) => s + (r.attempt_count ?? 0), 0);
      totalAttempts = filtered.reduce((s: number, r: any) => s + (r.attempt_count ?? 0), 0);
    } else {
      totalFails = failuresData.reduce((s, r) => s + (r.errors ?? 0) + (r.timeouts ?? 0), 0);
      totalAttempts = failuresData.reduce((s, r) => s + (r.total_attempts ?? 0), 0);
    }

    // ── Feedback (from daily view, or fall back to all-time) ──
    let fbUp: number;
    let fbDown: number;
    if (dailyFeedback.length > 0) {
      const filtered = startDate
        ? dailyFeedback.filter((r: any) => r.day && r.day >= startDate)
        : dailyFeedback;
      fbUp = filtered.filter((r: any) => r.vote === 'up').reduce((s: number, r: any) => s + (r.vote_count ?? 0), 0);
      fbDown = filtered.filter((r: any) => r.vote === 'down').reduce((s: number, r: any) => s + (r.vote_count ?? 0), 0);
    } else {
      fbUp = feedbackData.reduce((s, r) => s + (r.total_thumbs_up ?? 0), 0);
      fbDown = feedbackData.reduce((s, r) => s + (r.total_thumbs_down ?? 0), 0);
    }

    setPeriodStats({ serves: totalServes, cacheHits: totalCacheHits, cacheHitRate, cost: totalCost, failures: totalFails, totalAttempts, feedbackUp: fbUp, feedbackDown: fbDown });

    // ── Notification response rate (from v_notification_response_rate daily rows) ──
    // Empty array = view not available yet or zero notifications — render as zeros.
    const notifRows = dailyNotifications;
    const notifFiltered = startDate
      ? notifRows.filter((r: any) => r.day && r.day >= startDate)
      : notifRows;
    const notifs = notifFiltered.reduce((s: number, r: any) => s + (r.notifications ?? 0), 0);
    const notifCompleted = notifFiltered.reduce((s: number, r: any) => s + (r.completed ?? 0), 0);
    const notifEngaged = notifFiltered.reduce((s: number, r: any) => s + (r.engaged ?? 0), 0);
    const notifIgnored = notifFiltered.reduce((s: number, r: any) => s + (r.ignored ?? 0), 0);
    setNotificationStats({
      notifications: notifs,
      completed: notifCompleted,
      engaged: notifEngaged,
      ignored: notifIgnored,
      pctCompleted: notifs > 0 ? Math.round((notifCompleted / notifs) * 100) : null,
      pctEngaged: notifs > 0 ? Math.round((notifEngaged / notifs) * 100) : null,
      pctIgnored: notifs > 0 ? Math.round((notifIgnored / notifs) * 100) : null,
    });

    // ── Previous period for trend comparison ──
    const ms = periodToMs(p);
    if (ms && startDate) {
      const prevStartDate = new Date(Date.now() - ms * 2).toISOString().slice(0, 10);

      const prevCosts = costsData.filter(r => r.day && r.day >= prevStartDate && r.day < startDate);
      const prevServes = dailyServes.length > 0
        ? dailyServes.filter((r: any) => r.day && r.day >= prevStartDate && r.day < startDate).reduce((s: number, r: any) => s + (r.serve_count ?? 0), 0)
        : 0;
      const prevFailFiltered = dailyFailures.length > 0
        ? dailyFailures.filter((r: any) => r.day && r.day >= prevStartDate && r.day < startDate)
        : [];
      const prevFails = prevFailFiltered.filter((r: any) => r.status === 'error' || r.status === 'timeout').reduce((s: number, r: any) => s + (r.attempt_count ?? 0), 0);
      const prevTotalAttempts = prevFailFiltered.reduce((s: number, r: any) => s + (r.attempt_count ?? 0), 0);

      const prevCacheHits = dailyServes.length > 0
        ? dailyServes.filter((r: any) => r.day && r.day >= prevStartDate && r.day < startDate && r.serve_source === 'cache').reduce((s: number, r: any) => s + (r.serve_count ?? 0), 0)
        : 0;

      setPrevPeriodStats({
        serves: prevServes,
        cacheHits: prevCacheHits,
        cacheHitRate: prevServes > 0 ? Math.round((prevCacheHits / prevServes) * 100) : 0,
        cost: prevCosts.reduce((s, r) => s + (r.total_cost_usd ?? 0), 0),
        failures: prevFails,
        totalAttempts: prevTotalAttempts,
        feedbackUp: 0,
        feedbackDown: 0,
      });
    } else {
      setPrevPeriodStats(null);
    }
  }, []);

  const refreshRejections = useCallback(async () => {
    const { data: rejectData } = await supabase
      .from('generation_attempts')
      .select('id, companion_type, model, quality_gate_reason, error_message, status, created_at, latency_ms')
      .in('status', ['quality_gate_failed', 'error', 'timeout', 'rate_limited'])
      .order('created_at', { ascending: false })
      .limit(50);
    setRejections((rejectData ?? []) as RejectionRow[]);
  }, []);

  const fetchFeeds = useCallback(async () => {
    await refreshRejections();

    // Recent generated content (last 20 cache entries by creation date)
    const { data: contentData } = await supabase
      .from('companion_cache')
      .select('id, companion_type, content, quality_score, title, created_at, used_count, source_author')
      .order('created_at', { ascending: false })
      .limit(20);
    setRecentContent((contentData ?? []) as RecentContentRow[]);

    // Recent sessions (last 20 reflections)
    const { data: sessionData } = await (supabase
      .from('v_reflection_with_companions')
      .select('id, created_at, message, context, mood, outcome, signal_title, signal_source, grounding_title, history_insight_data, zoom_out_data, haiku, serve_source_signal, serve_source_ground_nudge, serve_source_historical_insight, serve_source_zoom_out')
      .order('created_at', { ascending: false })
      .limit(20) as any);
    setSessions((sessionData ?? []) as SessionRow[]);

    // Content library entries (table may not exist before migration — fail gracefully)
    try {
      const { data: libraryData, error: libErr } = await supabase
        .from('content_library')
        .select('id, type, title, author, summary, url, original_url, original_publication, tags, companion_types, quality_score, active, created_at')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!libErr) setLibraryEntries((libraryData ?? []) as unknown as LibraryEntryRow[]);
    } catch { /* table may not exist yet */ }
  }, [refreshRejections]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the admin-only RPC that checks is_admin() server-side
      const { data: adminData, error: rpcError } = await supabase.rpc('get_admin_stats' as any);

      let cacheData: CacheHitRow[] = [];
      let costData: CostRow[] = [];
      let failData: FailureRow[] = [];
      let feedData: FeedbackRow[] = [];

      if (rpcError) {
        throw new Error(`Admin stats: ${rpcError.message}`);
      }

      if (adminData) {
        const parsed = typeof adminData === 'string' ? JSON.parse(adminData) : adminData;
        cacheData = (parsed.cache_hits ?? []) as CacheHitRow[];
        costData = (parsed.costs ?? []) as CostRow[];
        failData = (parsed.failures ?? []) as FailureRow[];
        feedData = (parsed.feedback ?? []) as FeedbackRow[];
      }

      setCacheHits(cacheData);
      setCosts(costData);
      setFailures(failData);
      setFeedback(feedData);

      // Fetch daily breakdown views (may return empty if migration hasn't run)
      const [servesRes, failDayRes, fbDayRes, notifRes] = await Promise.all([
        supabase.from('v_companion_serves_per_day' as any).select('*').limit(500),
        supabase.from('v_generation_failures_per_day' as any).select('*').limit(500),
        supabase.from('v_companion_feedback_per_day' as any).select('*').limit(500),
        supabase.from('v_notification_response_rate' as any).select('*').limit(500),
      ]);

      const dailyServes = servesRes.error ? [] : (servesRes.data ?? []);
      const dailyFailures = failDayRes.error ? [] : (failDayRes.data ?? []);
      const dailyFeedback = fbDayRes.error ? [] : (fbDayRes.data ?? []);
      const dailyNotifications = notifRes.error ? [] : (notifRes.data ?? []);

      setServesPerDay(dailyServes);
      setFailuresPerDay(dailyFailures);
      setFeedbackPerDay(dailyFeedback);
      setNotificationPerDay(dailyNotifications);

      // Compute period stats from view data
      computePeriodStats(
        period,
        costData,
        cacheData,
        failData,
        feedData,
        dailyServes,
        dailyFailures,
        dailyFeedback,
        dailyNotifications,
      );

      await Promise.all([
        fetchCacheEntries(),
        fetchFeeds(),
      ]);

      const sourcesRes = await supabase
        .from('signal_sources')
        .select('id, name, type, url, category, last_fetch_feeds_at')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (!sourcesRes.error) setSignalSources((sourcesRes.data ?? []) as unknown as SignalSourceRow[]);

      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, [fetchCacheEntries, computePeriodStats, fetchFeeds, period]);

  useEffect(() => { if (enabled) fetchAll(); }, [fetchAll, enabled]);

  // Recompute period stats when period changes (no network call needed — uses cached view data)
  const handleSetPeriod = useCallback((p: TimePeriod) => {
    setPeriod(p);
    computePeriodStats(p, costs, cacheHits, failures, feedback, servesPerDay, failuresPerDay, feedbackPerDay, notificationPerDay);
  }, [computePeriodStats, costs, cacheHits, failures, feedback, servesPerDay, failuresPerDay, feedbackPerDay, notificationPerDay]);

  return {
    cacheHits, costs, failures, feedback, cacheEntries, signalSources,
    period, setPeriod: handleSetPeriod, periodStats, prevPeriodStats, notificationStats,
    rejections, recentContent, sessions, libraryEntries,
    loading, error, refresh: fetchAll, refreshCacheEntries: fetchCacheEntries,
    refreshCompanionCacheUi, refreshRejections, lastUpdated,
  };
}
