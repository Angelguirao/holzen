/**
 * Admin monitoring dashboard: parallel Supabase reads + `get_admin_stats` RPC
 * behind a single TanStack query key.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { UseQueryOptions } from '@tanstack/react-query';

/** Admin dashboard period filter (cost analytics + in-hook period aggregation). */
export type TimePeriod = 'today' | '7d' | '30d' | 'all';

// ── Row types (bundle + client-side period aggregation) ──

export interface CacheHitRow {
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

export interface CostRow {
  day: string | null;
  companion_type: string | null;
  attempts: number | null;
  total_cost_usd: number | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
}

export interface FailureRow {
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

export interface FeedbackRow {
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
  content: Json;
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

/** Rows from `v_companion_serves_per_day` (view — not in generated `Database`). */
export interface DailyServeRow {
  day?: string | null;
  serve_count?: number | null;
  serve_source?: string | null;
}
/** Rows from `v_generation_failures_per_day`. */
export interface DailyFailureRow {
  day?: string | null;
  status?: string | null;
  attempt_count?: number | null;
}
/** Rows from `v_companion_feedback_per_day`. */
export interface DailyFeedbackRow {
  day?: string | null;
  vote?: string | null;
  vote_count?: number | null;
}
/** Rows from `v_notification_response_rate`. */
export interface DailyNotificationRow {
  day?: string | null;
  notifications?: number | null;
  completed?: number | null;
  engaged?: number | null;
  ignored?: number | null;
}

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
  content: Json;
  quality_score: number;
  title: string | null;
  created_at: string;
  used_count: number;
  source_author: string | null;
}

export interface SessionRow {
  id: string;
  created_at: string;
  state: string;
  reflection_text: string | null;
  context_snapshot: Record<string, unknown> | null;
  initial_mood: string | null;
  outcome: string | null;
  haiku_text: string | null;
  counted_companion_types: string[] | null;
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

/** TanStack prefix segment(s) for `/admin` monitoring queries (`useAdminStats`). */
export const ADMIN_STATS_QUERY_PREFIX = ['admin'] as const;

export const ADMIN_STATS_BUNDLE_QUERY_LEAF = 'stats' as const;

/** TanStack Query key for the admin monitoring bundle (`useAdminStats`). */
export const ADMIN_STATS_QUERY_KEY = [
  ...ADMIN_STATS_QUERY_PREFIX,
  ADMIN_STATS_BUNDLE_QUERY_LEAF,
] as const;

/** Rows loaded together for `/admin` monitoring (RPC + views + feeds). */
export interface AdminStatsBundle {
  cacheHits: CacheHitRow[];
  costs: CostRow[];
  failures: FailureRow[];
  feedback: FeedbackRow[];
  cacheEntries: CacheEntryRow[];
  signalSources: SignalSourceRow[];
  rejections: RejectionRow[];
  recentContent: RecentContentRow[];
  sessions: SessionRow[];
  libraryEntries: LibraryEntryRow[];
  servesPerDay: DailyServeRow[];
  failuresPerDay: DailyFailureRow[];
  feedbackPerDay: DailyFeedbackRow[];
  notificationPerDay: DailyNotificationRow[];
}

export async function fetchAdminStatsBundle(): Promise<AdminStatsBundle> {
  const { data: adminData, error: rpcError } = await supabase.rpc('get_admin_stats' as never);

  if (rpcError) {
    throw new Error(`Admin stats: ${rpcError.message}`);
  }

  let cacheData: CacheHitRow[] = [];
  let costData: CostRow[] = [];
  let failData: FailureRow[] = [];
  let feedData: FeedbackRow[] = [];

  if (adminData) {
    const parsed = typeof adminData === 'string' ? JSON.parse(adminData) : adminData;
    cacheData = (parsed.cache_hits ?? []) as CacheHitRow[];
    costData = (parsed.costs ?? []) as CostRow[];
    failData = (parsed.failures ?? []) as FailureRow[];
    feedData = (parsed.feedback ?? []) as FeedbackRow[];
  }

  const [servesRes, failDayRes, fbDayRes, notifRes] = await Promise.all([
    supabase.from('v_companion_serves_per_day' as never).select('*').limit(500),
    supabase.from('v_generation_failures_per_day' as never).select('*').limit(500),
    supabase.from('v_companion_feedback_per_day' as never).select('*').limit(500),
    supabase.from('v_notification_response_rate' as never).select('*').limit(500),
  ]);

  const dailyServes = servesRes.error ? [] : (servesRes.data ?? []);
  const dailyFailures = failDayRes.error ? [] : (failDayRes.data ?? []);
  const dailyFeedback = fbDayRes.error ? [] : (fbDayRes.data ?? []);
  const dailyNotifications = notifRes.error ? [] : (notifRes.data ?? []);

  const { data: cacheRows, error: cacheErr } = await supabase
    .from('companion_cache')
    .select('id, companion_type, title, quality_score, used_count, expires_at, thumbs_up, thumbs_down, created_at, content')
    .order('quality_score', { ascending: false })
    .order('used_count', { ascending: false })
    .limit(200);

  const cacheEntries = (!cacheErr ? (cacheRows ?? []) : []) as CacheEntryRow[];

  const { data: rejectData } = await supabase
    .from('generation_attempts')
    .select('id, companion_type, model, quality_gate_reason, error_message, status, created_at, latency_ms')
    .in('status', ['quality_gate_failed', 'error', 'timeout', 'rate_limited'])
    .order('created_at', { ascending: false })
    .limit(50);
  const rejections = (rejectData ?? []) as RejectionRow[];

  const { data: contentData } = await supabase
    .from('companion_cache')
    .select('id, companion_type, content, quality_score, title, created_at, used_count, source_author')
    .order('created_at', { ascending: false })
    .limit(20);
  const recentContent = (contentData ?? []) as RecentContentRow[];

  const { data: sessionData } = await supabase
    .from('v_pause_full' as never)
    .select(
      'id, created_at, state, reflection_text, context_snapshot, initial_mood, outcome, haiku_text, counted_companion_types',
    )
    .order('created_at', { ascending: false })
    .limit(20);
  const sessions = (sessionData ?? []) as SessionRow[];

  let libraryEntries: LibraryEntryRow[] = [];
  try {
    const { data: libraryData, error: libErr } = await supabase
      .from('content_library')
      .select('id, type, title, author, summary, url, original_url, original_publication, tags, companion_types, quality_score, active, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!libErr) libraryEntries = (libraryData ?? []) as unknown as LibraryEntryRow[];
  } catch { /* table may not exist yet */ }

  const sourcesRes = await supabase
    .from('signal_sources')
    .select('id, name, type, url, category, last_fetch_feeds_at')
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  const signalSources = !sourcesRes.error
    ? ((sourcesRes.data ?? []) as unknown as SignalSourceRow[])
    : [];

  return {
    cacheHits: cacheData,
    costs: costData,
    failures: failData,
    feedback: feedData,
    cacheEntries,
    signalSources,
    rejections,
    recentContent,
    sessions,
    libraryEntries,
    servesPerDay: dailyServes as DailyServeRow[],
    failuresPerDay: dailyFailures as DailyFailureRow[],
    feedbackPerDay: dailyFeedback as DailyFeedbackRow[],
    notificationPerDay: dailyNotifications as DailyNotificationRow[],
  };
}

const ADMIN_STATS_STALE_MS = 30_000;

export function getAdminStatsBundleQueryOptions(): Pick<
  UseQueryOptions<AdminStatsBundle>,
  'queryKey' | 'queryFn' | 'staleTime' | 'refetchOnWindowFocus' | 'retry'
> {
  return {
    queryKey: ADMIN_STATS_QUERY_KEY,
    queryFn: fetchAdminStatsBundle,
    staleTime: ADMIN_STATS_STALE_MS,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
