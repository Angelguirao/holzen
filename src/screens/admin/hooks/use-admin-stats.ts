import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ADMIN_STATS_QUERY_KEY,
  getAdminStatsBundleQueryOptions,
  type AdminStatsBundle,
  type CacheEntryRow,
  type CacheHitRow,
  type CostRow,
  type DailyFeedbackRow,
  type DailyFailureRow,
  type DailyNotificationRow,
  type DailyServeRow,
  type FailureRow,
  type FeedbackRow,
  type LibraryEntryRow,
  type RecentContentRow,
  type RejectionRow,
  type SessionRow,
  type SignalSourceRow,
  type TimePeriod,
} from '@/screens/admin/lib/admin-stats-bundle-query';

export type {
  CacheEntryRow,
  SignalSourceRow,
  DailyServeRow,
  DailyFailureRow,
  DailyFeedbackRow,
  DailyNotificationRow,
  RejectionRow,
  RecentContentRow,
  SessionRow,
  LibraryEntryRow,
  AdminStatsBundle,
} from '@/screens/admin/lib/admin-stats-bundle-query';

export { ADMIN_STATS_QUERY_KEY } from '@/screens/admin/lib/admin-stats-bundle-query';

export type { TimePeriod } from '@/screens/admin/lib/admin-stats-bundle-query';

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
    case 'today':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case 'all':
      return null;
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

/**
 * Compute period stats from daily views (client-side filtering).
 * Uses the new v_companion_serves_per_day, v_generation_failures_per_day,
 * and v_companion_feedback_per_day views (after running the migration).
 * Falls back to all-time view data if daily views return empty.
 */
function computeAdminPeriodFields(
  p: TimePeriod,
  costsData: CostRow[],
  cacheHitsData: CacheHitRow[],
  failuresData: FailureRow[],
  feedbackData: FeedbackRow[],
  dailyServes: DailyServeRow[],
  dailyFailures: DailyFailureRow[],
  dailyFeedback: DailyFeedbackRow[],
  dailyNotifications: DailyNotificationRow[],
): {
  periodStats: PeriodStats;
  notificationStats: NotificationResponseStats;
  prevPeriodStats: PeriodStats | null;
} {
  const start = periodStart(p);
  const startDate = start?.slice(0, 10);

  let totalServes: number;
  let totalCacheHits: number;
  if (dailyServes.length > 0) {
    const filtered = startDate ? dailyServes.filter((r) => r.day && r.day >= startDate) : dailyServes;
    totalServes = filtered.reduce((s, r) => s + (r.serve_count ?? 0), 0);
    totalCacheHits = filtered
      .filter((r) => r.serve_source === 'cache')
      .reduce((s, r) => s + (r.serve_count ?? 0), 0);
  } else {
    totalServes = cacheHitsData.reduce((s, r) => s + (r.total_serves ?? 0), 0);
    totalCacheHits = cacheHitsData.reduce((s, r) => s + (r.cache_hits ?? 0), 0);
  }
  const cacheHitRate = totalServes > 0 ? Math.round((totalCacheHits / totalServes) * 100) : 0;

  const filteredCosts = startDate ? costsData.filter((r) => r.day && r.day >= startDate) : costsData;
  const totalCost = filteredCosts.reduce((s, r) => s + (r.total_cost_usd ?? 0), 0);

  let totalFails: number;
  let totalAttempts: number;
  if (dailyFailures.length > 0) {
    const filtered = startDate ? dailyFailures.filter((r) => r.day && r.day >= startDate) : dailyFailures;
    totalFails = filtered
      .filter((r) => r.status === 'error' || r.status === 'timeout')
      .reduce((s, r) => s + (r.attempt_count ?? 0), 0);
    totalAttempts = filtered.reduce((s, r) => s + (r.attempt_count ?? 0), 0);
  } else {
    totalFails = failuresData.reduce((s, r) => s + (r.errors ?? 0) + (r.timeouts ?? 0), 0);
    totalAttempts = failuresData.reduce((s, r) => s + (r.total_attempts ?? 0), 0);
  }

  let fbUp: number;
  let fbDown: number;
  if (dailyFeedback.length > 0) {
    const filtered = startDate ? dailyFeedback.filter((r) => r.day && r.day >= startDate) : dailyFeedback;
    fbUp = filtered.filter((r) => r.vote === 'up').reduce((s, r) => s + (r.vote_count ?? 0), 0);
    fbDown = filtered.filter((r) => r.vote === 'down').reduce((s, r) => s + (r.vote_count ?? 0), 0);
  } else {
    fbUp = feedbackData.reduce((s, r) => s + (r.total_thumbs_up ?? 0), 0);
    fbDown = feedbackData.reduce((s, r) => s + (r.total_thumbs_down ?? 0), 0);
  }

  const periodStats: PeriodStats = {
    serves: totalServes,
    cacheHits: totalCacheHits,
    cacheHitRate,
    cost: totalCost,
    failures: totalFails,
    totalAttempts,
    feedbackUp: fbUp,
    feedbackDown: fbDown,
  };

  const notifRows = dailyNotifications;
  const notifFiltered = startDate ? notifRows.filter((r) => r.day && r.day >= startDate) : notifRows;
  const notifs = notifFiltered.reduce((s, r) => s + (r.notifications ?? 0), 0);
  const notifCompleted = notifFiltered.reduce((s, r) => s + (r.completed ?? 0), 0);
  const notifEngaged = notifFiltered.reduce((s, r) => s + (r.engaged ?? 0), 0);
  const notifIgnored = notifFiltered.reduce((s, r) => s + (r.ignored ?? 0), 0);
  const notificationStats: NotificationResponseStats = {
    notifications: notifs,
    completed: notifCompleted,
    engaged: notifEngaged,
    ignored: notifIgnored,
    pctCompleted: notifs > 0 ? Math.round((notifCompleted / notifs) * 100) : null,
    pctEngaged: notifs > 0 ? Math.round((notifEngaged / notifs) * 100) : null,
    pctIgnored: notifs > 0 ? Math.round((notifIgnored / notifs) * 100) : null,
  };

  const ms = periodToMs(p);
  let prevPeriodStats: PeriodStats | null = null;
  if (ms && startDate) {
    const prevStartDate = new Date(Date.now() - ms * 2).toISOString().slice(0, 10);

    const prevCosts = costsData.filter((r) => r.day && r.day >= prevStartDate && r.day < startDate);
    const prevServes =
      dailyServes.length > 0
        ? dailyServes
            .filter((r) => r.day && r.day >= prevStartDate && r.day < startDate)
            .reduce((s, r) => s + (r.serve_count ?? 0), 0)
        : 0;
    const prevFailFiltered =
      dailyFailures.length > 0 ? dailyFailures.filter((r) => r.day && r.day >= prevStartDate && r.day < startDate) : [];
    const prevFails = prevFailFiltered
      .filter((r) => r.status === 'error' || r.status === 'timeout')
      .reduce((s, r) => s + (r.attempt_count ?? 0), 0);
    const prevTotalAttempts = prevFailFiltered.reduce((s, r) => s + (r.attempt_count ?? 0), 0);

    const prevCacheHits =
      dailyServes.length > 0
        ? dailyServes
            .filter(
              (r) =>
                r.day && r.day >= prevStartDate && r.day < startDate && r.serve_source === 'cache',
            )
            .reduce((s, r) => s + (r.serve_count ?? 0), 0)
        : 0;

    prevPeriodStats = {
      serves: prevServes,
      cacheHits: prevCacheHits,
      cacheHitRate: prevServes > 0 ? Math.round((prevCacheHits / prevServes) * 100) : 0,
      cost: prevCosts.reduce((s, r) => s + (r.total_cost_usd ?? 0), 0),
      failures: prevFails,
      totalAttempts: prevTotalAttempts,
      feedbackUp: 0,
      feedbackDown: 0,
    };
  }

  return { periodStats, notificationStats, prevPeriodStats };
}

export function useAdminStats(enabled = true): AdminStats {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<TimePeriod>('7d');

  const statsQuery = useQuery({
    ...getAdminStatsBundleQueryOptions(),
    enabled,
  });

  const bundle = statsQuery.data;

  const { periodStats, prevPeriodStats, notificationStats } = useMemo(() => {
    if (!bundle) {
      const emptyPeriod: PeriodStats = {
        serves: 0,
        cacheHits: 0,
        cacheHitRate: 0,
        cost: 0,
        failures: 0,
        totalAttempts: 0,
        feedbackUp: 0,
        feedbackDown: 0,
      };
      const emptyNotif: NotificationResponseStats = {
        notifications: 0,
        completed: 0,
        engaged: 0,
        ignored: 0,
        pctCompleted: null,
        pctEngaged: null,
        pctIgnored: null,
      };
      return {
        periodStats: emptyPeriod,
        prevPeriodStats: null as PeriodStats | null,
        notificationStats: emptyNotif,
      };
    }
    return computeAdminPeriodFields(
      period,
      bundle.costs,
      bundle.cacheHits,
      bundle.failures,
      bundle.feedback,
      bundle.servesPerDay,
      bundle.failuresPerDay,
      bundle.feedbackPerDay,
      bundle.notificationPerDay,
    );
  }, [bundle, period]);

  const handleSetPeriod = useCallback((p: TimePeriod) => {
    setPeriod(p);
  }, []);

  const refreshCacheEntries = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('companion_cache')
      .select('id, companion_type, title, quality_score, used_count, expires_at, thumbs_up, thumbs_down, created_at, content')
      .order('quality_score', { ascending: false })
      .order('used_count', { ascending: false })
      .limit(200);
    queryClient.setQueryData<AdminStatsBundle>(ADMIN_STATS_QUERY_KEY, (prev) => {
      if (!prev || err) return prev;
      return { ...prev, cacheEntries: (data ?? []) as CacheEntryRow[] };
    });
  }, [queryClient]);

  const refreshCompanionCacheUi = useCallback(async () => {
    const { data: cacheRows, error: cacheErr } = await supabase
      .from('companion_cache')
      .select('id, companion_type, title, quality_score, used_count, expires_at, thumbs_up, thumbs_down, created_at, content')
      .order('quality_score', { ascending: false })
      .order('used_count', { ascending: false })
      .limit(200);
    const { data: contentData } = await supabase
      .from('companion_cache')
      .select('id, companion_type, content, quality_score, title, created_at, used_count, source_author')
      .order('created_at', { ascending: false })
      .limit(20);
    queryClient.setQueryData<AdminStatsBundle>(ADMIN_STATS_QUERY_KEY, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cacheEntries: (!cacheErr ? (cacheRows ?? []) : prev.cacheEntries) as CacheEntryRow[],
        recentContent: (contentData ?? prev.recentContent) as RecentContentRow[],
      };
    });
  }, [queryClient]);

  const refreshRejections = useCallback(async () => {
    const { data: rejectData } = await supabase
      .from('generation_attempts')
      .select('id, companion_type, model, quality_gate_reason, error_message, status, created_at, latency_ms')
      .in('status', ['quality_gate_failed', 'error', 'timeout', 'rate_limited'])
      .order('created_at', { ascending: false })
      .limit(50);
    queryClient.setQueryData<AdminStatsBundle>(ADMIN_STATS_QUERY_KEY, (prev) =>
      prev ? { ...prev, rejections: (rejectData ?? []) as RejectionRow[] } : prev,
    );
  }, [queryClient]);

  const loading = enabled ? statsQuery.isPending && !statsQuery.data : true;
  const error =
    statsQuery.error instanceof Error
      ? statsQuery.error.message
      : statsQuery.error
        ? 'Failed to load monitoring data'
        : null;

  const lastUpdated =
    statsQuery.isSuccess && bundle ? new Date(statsQuery.dataUpdatedAt) : null;

  return {
    cacheHits: bundle?.cacheHits ?? [],
    costs: bundle?.costs ?? [],
    failures: bundle?.failures ?? [],
    feedback: bundle?.feedback ?? [],
    cacheEntries: bundle?.cacheEntries ?? [],
    signalSources: bundle?.signalSources ?? [],
    period,
    setPeriod: handleSetPeriod,
    periodStats,
    prevPeriodStats,
    notificationStats,
    rejections: bundle?.rejections ?? [],
    recentContent: bundle?.recentContent ?? [],
    sessions: bundle?.sessions ?? [],
    libraryEntries: bundle?.libraryEntries ?? [],
    loading,
    error,
    refresh: () => void statsQuery.refetch(),
    refreshCacheEntries,
    refreshCompanionCacheUi,
    refreshRejections,
    lastUpdated,
  };
}
