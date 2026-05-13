import { useAdminStats } from '@/hooks/use-admin-stats';
import { useIsAdmin } from '@/hooks/use-is-admin';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Activity, Database, DollarSign, AlertTriangle, ThumbsUp, Clock, Loader2, ShieldX, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { label, shortModelName, serveSourceBadgeClass, PERIOD_OPTIONS, TAB_TRIGGER_CLASS, TYPE_COLORS } from '@/components/admin/admin-constants';
import { StatCard, TrendInfo } from '@/components/admin/StatCard';
import { FilterRow } from '@/components/admin/FilterRow';
import { FeedCard } from '@/components/admin/FeedCard';
import { AdminBulkBar } from '@/components/admin/AdminBulkBar';
import { RejectionEntry } from '@/components/admin/RejectionEntry';
import { CuratedContentManager } from '@/components/admin/CuratedContentManager';
import { HardcodedFallbacksManager } from '@/components/admin/HardcodedFallbacksManager';
import { SourceCatalogViewer } from '@/components/admin/SourceCatalogViewer';
import { SourceSuggestionsPanel } from '@/components/admin/SourceSuggestionsPanel';
import { ContentLibraryViewer } from '@/components/admin/ContentLibraryViewer';
import { AdminSubNav } from '@/components/admin/AdminSubNav';
import { AppConfigTools } from '@/components/admin/AppConfigTools';
import { MigrationStatus } from '@/components/admin/MigrationStatus';
import { CostAnalytics } from '@/components/admin/CostAnalytics';
import { DemoModeToggle } from '@/components/admin/DemoModeToggle';
import { BadgeDebug } from '@/components/admin/BadgeDebug';
import { adminDeleteRowsByIds } from '@/lib/admin-delete';

function computeTrend(current: number, previous: number | null, invertColor: boolean): TrendInfo | undefined {
  if (previous === null || previous === undefined) return undefined;
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return undefined;
  const pctChange = Math.round(((current - previous) / previous) * 100);
  if (pctChange === 0) return { direction: 'flat', label: '0%' };
  const raw: 'up' | 'down' = pctChange > 0 ? 'up' : 'down';
  const displayed = invertColor ? (raw === 'up' ? 'down' : 'up') : raw;
  return { direction: displayed, label: `${Math.abs(pctChange)}%` };
}

const inferTheme = (context: string | null, mood: string | null): string | null => {
  const isDown = context?.toLowerCase().includes('is down');
  const isUp = context?.toLowerCase().includes('is up');
  if (mood === 'fearful' || (mood === 'anxious' && isDown)) return 'patience';
  if (mood === 'anxious') return 'steadiness';
  if (mood === 'fomo' || mood === 'greedy') return 'grounding';
  if (mood === 'excited' && isUp) return 'humility';
  if (mood === 'calm' || mood === 'detached') return 'composure';
  if (isDown) return 'patience';
  if (isUp) return 'humility';
  return null;
};

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw) as unknown;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch { /* ignore */ }
  }
  return null;
}

function historyInsightTitleFromData(data: unknown): string | null {
  const o = parseJsonObject(data);
  const t = o?.title;
  return typeof t === 'string' ? t : null;
}

function zoomOutDeepTimeTitleFromData(data: unknown): string | null {
  const o = parseJsonObject(data);
  const deepTime = o?.deepTime;
  if (typeof deepTime !== 'object' || deepTime === null || Array.isArray(deepTime)) return null;
  const t = (deepTime as Record<string, unknown>).title;
  return typeof t === 'string' ? t : null;
}

function ServeSourceTag({ source }: { source?: string | null }) {
  const s = source ?? null;
  const text = s ?? 'n/a';
  return (
    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wide ${serveSourceBadgeClass(s)}`} title="From companion_serves at generation time">
      {text}
    </span>
  );
}

const FEED_DELETE_CHUNK = 40;
const REJECTION_DELETE_CHUNK = 40;

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const {
    cacheHits, costs, failures, feedback, cacheEntries, signalSources,
    period, setPeriod, periodStats, prevPeriodStats, notificationStats,
    rejections, recentContent, sessions, libraryEntries,
    loading, error, refresh, refreshCacheEntries, refreshCompanionCacheUi, refreshRejections, lastUpdated,
  } = useAdminStats(!adminLoading && isAdmin);

  // ── ALL HOOKS MUST BE ABOVE EARLY RETURNS ──

  const failureRate = periodStats.totalAttempts > 0
    ? Math.round((periodStats.failures / periodStats.totalAttempts) * 100)
    : 0;
  const prevFailureRate = prevPeriodStats && prevPeriodStats.totalAttempts > 0
    ? Math.round((prevPeriodStats.failures / prevPeriodStats.totalAttempts) * 100)
    : null;

  const servesTrend = computeTrend(periodStats.serves, prevPeriodStats?.serves ?? null, false);
  const cacheHitTrend = computeTrend(periodStats.cacheHitRate, prevPeriodStats?.cacheHitRate ?? null, false);
  const costTrend = computeTrend(periodStats.cost, prevPeriodStats?.cost ?? null, true);
  const failureTrend = computeTrend(failureRate, prevFailureRate, true);

  const costChartData = useMemo(() => {
    const dayMap = new Map<string, Record<string, number>>();
    for (const row of costs) {
      if (!row.day) continue;
      const day = row.day.slice(0, 10);
      if (!dayMap.has(day)) dayMap.set(day, {});
      const entry = dayMap.get(day)!;
      const type = row.companion_type ?? 'unknown';
      entry[type] = (entry[type] ?? 0) + (row.total_cost_usd ?? 0);
      entry.total = (entry.total ?? 0) + (row.total_cost_usd ?? 0);
    }
    return Array.from(dayMap.entries())
      .map(([day, data]) => ({ day: day.slice(5), ...data }))
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);
  }, [costs]);

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label.toLowerCase() ?? period;

  // ── Session filters ──
  const [sessionMoodFilter, setSessionMoodFilter] = useState<string>('all');
  const [sessionOutcomeFilter, setSessionOutcomeFilter] = useState<string>('all');
  const [sessionCompanionFilter, setSessionCompanionFilter] = useState<string>('all');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const sessionMoodOptions = useMemo(() => {
    const moods = Array.from(
      new Set(sessions.map(s => s.initial_mood).filter(Boolean) as string[]),
    ).sort();
    return [{ value: 'all', label: 'All' }, ...moods.map(m => ({ value: m, label: m }))];
  }, [sessions]);

  const sessionOutcomeOptions = [
    { value: 'all', label: 'All' },
    { value: 'held', label: 'held' },
    { value: 'sold', label: 'sold' },
    { value: 'bought', label: 'bought' },
    { value: 'pending', label: 'pending' },
  ];

  const sessionCompanionOptions = [
    { value: 'all', label: 'All' },
    { value: 'missing', label: 'Missing' },
  ];

  const filteredSessions = useMemo(() => sessions.filter(s => {
    if (sessionMoodFilter !== 'all' && s.initial_mood !== sessionMoodFilter) return false;
    if (sessionOutcomeFilter !== 'all') {
      if (sessionOutcomeFilter === 'pending') { if (s.outcome) return false; }
      else if (s.outcome !== sessionOutcomeFilter) return false;
    }
    if (sessionCompanionFilter === 'missing') {
      const counted = (s.counted_companion_types ?? []).length;
      const allLoaded = counted >= 5 && !!s.haiku_text;
      if (allLoaded) return false;
    }
    return true;
  }), [sessions, sessionMoodFilter, sessionOutcomeFilter, sessionCompanionFilter]);

  // ── Feed filters ──
  const [feedTypeFilter, setFeedTypeFilter] = useState('all');
  const feedTypeOptions = useMemo(() => {
    const types = Array.from(new Set(recentContent.map(c => c.companion_type))).sort();
    return [{ value: 'all', label: 'All' }, ...types.map(t => ({ value: t, label: label(t) }))];
  }, [recentContent]);
  const filteredFeed = useMemo(() => {
    if (feedTypeFilter === 'all') return recentContent;
    return recentContent.filter(c => c.companion_type === feedTypeFilter);
  }, [recentContent, feedTypeFilter]);

  const [feedSelectedIds, setFeedSelectedIds] = useState<Set<string>>(() => new Set());
  const [feedBulkBusy, setFeedBulkBusy] = useState(false);
  const feedIdsShown = useMemo(() => filteredFeed.map((c) => c.id), [filteredFeed]);

  useEffect(() => {
    setFeedSelectedIds((prev) => {
      const allowed = new Set(feedIdsShown);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [feedIdsShown]);

  const bulkDeleteFeedItems = useCallback(async () => {
    const ids = feedIdsShown.filter((id) => feedSelectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} cache entr${ids.length === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    setFeedBulkBusy(true);
    try {
      const { deleted, errorMessage } = await adminDeleteRowsByIds('companion_cache', ids, FEED_DELETE_CHUNK);
      if (errorMessage) {
        toast({ title: 'Bulk delete failed', description: errorMessage, variant: 'destructive' });
        return;
      }
      setFeedSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
      await refreshCompanionCacheUi();
      toast({ title: 'Deleted', description: `${deleted} entr${deleted === 1 ? 'y' : 'ies'} removed.` });
    } finally {
      setFeedBulkBusy(false);
    }
  }, [feedIdsShown, feedSelectedIds, toast, refreshCompanionCacheUi]);

  // ── Rejection filters ──
  const [rejectionTypeFilter, setRejectionTypeFilter] = useState('all');
  const [rejectionStatusFilter, setRejectionStatusFilter] = useState('all');
  const rejectionTypeOptions = useMemo(() => {
    const types = Array.from(new Set(rejections.map(r => r.companion_type))).sort();
    return [{ value: 'all', label: 'All' }, ...types.map(t => ({ value: t, label: label(t) }))];
  }, [rejections]);
  const rejectionStatusOptions = useMemo(() => {
    const statuses = Array.from(new Set(rejections.map(r => r.status))).sort();
    return [{ value: 'all', label: 'All' }, ...statuses.map(s => ({ value: s, label: s }))];
  }, [rejections]);
  const filteredRejections = useMemo(() => rejections.filter(r => {
    if (rejectionTypeFilter !== 'all' && r.companion_type !== rejectionTypeFilter) return false;
    if (rejectionStatusFilter !== 'all' && r.status !== rejectionStatusFilter) return false;
    return true;
  }), [rejections, rejectionTypeFilter, rejectionStatusFilter]);

  const [rejectionSelectedIds, setRejectionSelectedIds] = useState<Set<string>>(() => new Set());
  const [rejectionBulkBusy, setRejectionBulkBusy] = useState(false);
  const rejectionIdsShown = useMemo(() => filteredRejections.map((r) => r.id), [filteredRejections]);

  useEffect(() => {
    setRejectionSelectedIds((prev) => {
      const allowed = new Set(rejectionIdsShown);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [rejectionIdsShown]);

  const bulkDeleteRejections = useCallback(async () => {
    const ids = rejectionIdsShown.filter((id) => rejectionSelectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Permanently delete ${ids.length} generation attempt record${ids.length === 1 ? '' : 's'}?`)) return;
    setRejectionBulkBusy(true);
    try {
      const { deleted, errorMessage } = await adminDeleteRowsByIds('generation_attempts', ids, REJECTION_DELETE_CHUNK);
      if (errorMessage) {
        toast({ title: 'Bulk delete failed', description: errorMessage, variant: 'destructive' });
        return;
      }
      setRejectionSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
      await refreshRejections();
      toast({ title: 'Deleted', description: `${deleted} record${deleted === 1 ? '' : 's'} removed.` });
    } finally {
      setRejectionBulkBusy(false);
    }
  }, [rejectionIdsShown, rejectionSelectedIds, toast, refreshRejections]);

  // ── Early returns (after all hooks) ──
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 py-10 text-center">
        <ShieldX className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <p className="text-xs font-mono text-muted-foreground/40">Admin access required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/80">System Monitor</h2>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-border/15 bg-card/10 h-20 animate-pulse" />
          ))}
        </div>
        <div className="rounded-xl border border-border/15 bg-card/10 h-48 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/80">System Monitor</h2>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-xs text-destructive/70">{error}</p>
          <button onClick={refresh} className="mt-2 text-[10px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const costWarn = period === 'today' ? 8 : period === '7d' ? 50 : period === '30d' ? 200 : 999;
  const costTip = period === 'today' ? 5 : period === '7d' ? 30 : period === '30d' ? 100 : 999;
  const issues: string[] = [];
  const tips: string[] = [];
  if (failureRate > 20) issues.push('High failure rate — check if API keys (Perplexity/Lovable) are valid and not rate-limited');
  else if (failureRate > 5) tips.push('Some generation failures — see Recent generation failures under Monitor');
  if (periodStats.cost > costWarn) {
    issues.push(period === 'today'
      ? 'Approaching daily budget cap ($10) — generation will be blocked when exceeded'
      : `High spend for ${periodLabel}: $${periodStats.cost.toFixed(2)}`);
  } else if (periodStats.cost > costTip) {
    tips.push(`Moderate spend ($${periodStats.cost.toFixed(2)}) for ${periodLabel}`);
  }
  if (periodStats.cacheHitRate < 10 && periodStats.cost > 3) {
    tips.push('Low cache hit rate with moderate cost — consider scheduling the cache warmer cron to reduce API spend');
  } else if (periodStats.cacheHitRate < 10 && periodStats.serves > 50) {
    tips.push('Cache hit rate is low — the cache warmer (pregenerate-companions) could help as usage grows');
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <AdminSubNav />
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/80">System Monitor</h2>
        <button onClick={refresh} className="flex items-center gap-1.5 text-[10px] font-sans font-medium text-muted-foreground/60 hover:text-nox-text-link transition-colors">
          <RefreshCw className="h-3 w-3" />
          {lastUpdated && <span>{lastUpdated.toLocaleTimeString()}</span>}
        </button>
      </div>

      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList className="inline-flex h-auto flex-wrap items-center gap-1 rounded-lg bg-muted/30 p-1">
          <TabsTrigger value="monitor" className={TAB_TRIGGER_CLASS}>Monitor</TabsTrigger>
          <TabsTrigger value="cost" className={TAB_TRIGGER_CLASS}>Cost</TabsTrigger>
          <TabsTrigger value="activity" className={TAB_TRIGGER_CLASS}>Activity</TabsTrigger>
          <TabsTrigger value="sources" className={TAB_TRIGGER_CLASS}>Sources</TabsTrigger>
          <TabsTrigger value="library" className={TAB_TRIGGER_CLASS}>Library{libraryEntries.length > 0 ? ` (${libraryEntries.length})` : ''}</TabsTrigger>
          <TabsTrigger value="content" className={TAB_TRIGGER_CLASS}>Cache</TabsTrigger>
          <TabsTrigger value="fallbacks" className={TAB_TRIGGER_CLASS}>Fallbacks</TabsTrigger>
          <TabsTrigger value="tools" className={TAB_TRIGGER_CLASS}>Tools</TabsTrigger>
        </TabsList>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed max-w-3xl">
          Tab order matches the pipeline: <span className="text-muted-foreground/55">Monitor</span> (telemetry + generation failures).
          <span className="text-muted-foreground/55"> Activity</span> — pause sessions and newest cache writes.
          <span className="text-muted-foreground/55"> Sources</span> — live-search catalog + pending AI-suggested rows (approve/reject).
          <span className="text-muted-foreground/55"> Library</span> — curated essays/papers/events used when live generation falls back.
          <span className="text-muted-foreground/55"> Cache</span> — pregen pool in <code className="text-muted-foreground/50">companion_cache</code> (promote/demote/delete).
          <span className="text-muted-foreground/55"> Fallbacks</span> — last-resort strings in <code className="text-muted-foreground/50">companion_fallbacks</code> (edit JSON, toggle active, reorder).
        </p>

        {/* Tab 1: Monitor */}
        <TabsContent value="monitor" className="space-y-6 mt-0">
          {/* Health Summary */}
          {issues.length > 0 || tips.length > 0 ? (
            <div className={`rounded-xl border px-4 py-2.5 space-y-1 ${
              issues.length > 0 ? 'border-destructive/20 bg-destructive/5' : 'border-border/20 bg-card/10'
            }`}>
              {[...issues.map(msg => ({ msg, level: 'issue' as const })), ...tips.map(msg => ({ msg, level: 'tip' as const }))].map(({ msg, level }, i) => (
                <p key={i} className={`text-[10px] font-mono ${level === 'issue' ? 'text-destructive/70' : 'text-muted-foreground/50'}`}>
                  {level === 'issue' ? '⚠' : '💡'} {msg}
                </p>
              ))}
            </div>
          ) : periodStats.serves > 0 ? (
            <div className="rounded-xl border border-primary/15 bg-primary/3 px-4 py-2.5">
              <p className="text-[10px] font-mono text-muted-foreground">
                ✓ System healthy — {[
                  `${failureRate}% failure rate`,
                  periodStats.cost > 0 && `$${periodStats.cost.toFixed(3)} cost`,
                  periodStats.cacheHitRate > 0 && `${periodStats.cacheHitRate}% cache hit`,
                  `${periodStats.serves} serves`,
                ].filter(Boolean).join(' · ')}
              </p>
            </div>
          ) : null}

          {/* Period Selector */}
          <div className="flex items-center gap-1.5">
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setPeriod(opt.value)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                  period === opt.value ? 'bg-muted/60 text-foreground' : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/20'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Activity} title="Serves" value={periodStats.serves.toLocaleString()} subtitle={periodLabel} trend={servesTrend} />
            <StatCard icon={Database} title="Cache Hit" value={`${periodStats.cacheHitRate}%`}
              subtitle={periodStats.cacheHitRate === 0 ? 'all live — fresh content' : periodStats.cacheHitRate < 30 ? 'mostly live generation' : 'good cache usage'}
              trend={cacheHitTrend}
            />
            <StatCard
              icon={DollarSign}
              title="Cost"
              value={`$${periodStats.cost.toFixed(3)}`}
              subtitle={periodLabel}
              alert={periodStats.cost > costWarn}
              trend={costTrend}
            />
            <StatCard
              icon={AlertTriangle}
              title="Failure Rate"
              value={`${failureRate}%`}
              subtitle="target: <10%"
              alert={failureRate > 20}
              trend={failureTrend}
            />
          </div>

          {/* Cost Chart */}
          {costChartData.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Daily Cost (14d)</p>
              <div className="rounded-xl border border-border/15 bg-card/5 p-3">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={costChartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground) / 0.3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground) / 0.3)' }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.2)', borderRadius: '8px', fontSize: '10px', fontFamily: 'monospace' }}
                      formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
                      labelStyle={{ fontSize: '10px', color: 'hsl(var(--muted-foreground) / 0.6)' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={24}>
                      {costChartData.map((_, i) => <Cell key={i} fill="hsl(var(--primary) / 0.3)" />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {costChartData.length === 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Daily Cost</p>
              <div className="rounded-xl border border-border/20 bg-card/10 p-6 text-center">
                <p className="text-[10px] text-muted-foreground/50">No cost data yet — generate some sessions to see the chart</p>
              </div>
            </div>
          )}

          {/* Notification Response Rate — explicitly separated from behavioural scores.
              Counts what the pause notification pipeline actually produced: how many
              push/email/bell notifications we dispatched, and how many users acted on
              them (completed a decision / fully engaged with the pause). Rows that
              remain "ignored" never count toward Holzen Score, skill balance, badges
              or quota — they're just the denominator here. Source:
              v_notification_response_rate. */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              Notification Response <span className="text-muted-foreground/40 normal-case">({periodLabel})</span>
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              Pipeline output, not user behaviour. <span className="text-muted-foreground/55">ignored</span> rows never touch Holzen Score / skill balance / badges — they're tracked here so we can see pipeline effectiveness independently of engagement quality.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Bell}
                title="Sent"
                value={notificationStats.notifications.toLocaleString()}
                subtitle={periodLabel}
              />
              <StatCard
                icon={Activity}
                title="Completed"
                value={notificationStats.pctCompleted === null ? '—' : `${notificationStats.pctCompleted}%`}
                subtitle={`${notificationStats.completed} decisions recorded`}
              />
              <StatCard
                icon={ThumbsUp}
                title="Engaged"
                value={notificationStats.pctEngaged === null ? '—' : `${notificationStats.pctEngaged}%`}
                subtitle={`${notificationStats.engaged} full flow`}
              />
              <StatCard
                icon={ShieldX}
                title="Ignored"
                value={notificationStats.pctIgnored === null ? '—' : `${notificationStats.pctIgnored}%`}
                subtitle={`${notificationStats.ignored} no interaction`}
              />
            </div>
          </div>

          {/* Cache Hit Rates */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Cache Hit Rates <span className="text-muted-foreground/40 normal-case">(30 days)</span></p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              One row per <code className="text-muted-foreground/55">companion_type</code> in serves. Two “Zoom” rows mean timeline zoom vs deep-time zoom are stored as different types.
            </p>
            <div className="space-y-1.5">
              {cacheHits.map((row, i) => {
                const pct = row.cache_hit_pct ?? 0;
                const type = row.companion_type ?? 'unknown';
                return (
                  <div key={i} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-foreground/80">{label(type)}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">{pct.toFixed(0)}% · {row.total_serves ?? 0} serves</span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: TYPE_COLORS[type] ?? 'hsl(var(--primary) / 0.4)' }} />
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] text-muted-foreground/50">live: {row.live_generated ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">cache: {row.cache_hits ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">curated: {row.curated_fallbacks ?? 0}</span>
                    </div>
                  </div>
                );
              })}
              {cacheHits.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center py-3">No serve data yet</p>}
            </div>
            <p className="text-[9px] font-mono text-muted-foreground/40 leading-relaxed">
              <span className="text-muted-foreground/50">live</span> = generated on demand. <span className="text-muted-foreground/50">cache</span> = row from <code className="text-muted-foreground/45">companion_cache</code> or a Library pick (library serves are still labeled cache in telemetry). <span className="text-muted-foreground/50">curated</span> = hardcoded fallback strings when DB pool is empty — not editable here; use <span className="text-muted-foreground/55">Library</span> + <span className="text-muted-foreground/55">Cache</span> tabs to manage DB-backed fallbacks.
            </p>
          </div>

          {/* Generation Health */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Generation Health <span className="text-muted-foreground/40 normal-case">(30 days)</span></p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              Grouped by companion type <strong className="font-normal text-muted-foreground/55">and</strong> model. Multiple rows for the same label mean different Gemini models (e.g. flash vs flash-lite).
            </p>
            <div className="space-y-1.5">
              {failures.map((row, i) => {
                const failPct = row.failure_pct ?? 0;
                const isAlert = failPct > 20;
                const rateLimited = Number((row as { rate_limited?: number }).rate_limited ?? 0);
                return (
                  <div key={i} className={`rounded-lg border px-3 py-2 ${isAlert ? 'border-destructive/20 bg-destructive/5' : 'border-border/10 bg-card/5'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-foreground/80">
                          {label(row.companion_type)}
                          {row.model ? (
                            <span className="text-muted-foreground/50"> · {shortModelName(row.model)}</span>
                          ) : null}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono ${isAlert ? 'text-destructive/70' : 'text-muted-foreground/40'}`}>{failPct.toFixed(1)}% fail</span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] text-muted-foreground/50">✓ {row.successes ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">✗ {row.errors ?? 0} err</span>
                      <span className="text-[9px] text-muted-foreground/50">⏱ {row.timeouts ?? 0} timeout</span>
                      <span className="text-[9px] text-muted-foreground/50">⚠ {row.quality_gate_failures ?? 0} quality</span>
                      {rateLimited > 0 && <span className="text-[9px] text-destructive/70">🚫 {rateLimited} rate limit</span>}
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> avg {((row.avg_latency_ms ?? 0) / 1000).toFixed(1)}s
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">P95 {((row.p95_latency_ms ?? 0) / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                );
              })}
              {failures.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center py-3">No generation data yet</p>}
            </div>
          </div>

          {/* Recent generation failures (was separate tab) */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              Recent generation failures <span className="text-muted-foreground/40 normal-case">({rejections.length} latest)</span>
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              Latest rows in <code className="text-muted-foreground/55">generation_attempts</code> with failed status. Deleting them only clears logs; it does not change Monitor aggregates until you refresh or the period rolls. Same list as before under the old Rejections tab.
            </p>
            <FilterRow label="Type" options={rejectionTypeOptions} value={rejectionTypeFilter} onChange={setRejectionTypeFilter} />
            <FilterRow label="Status" options={rejectionStatusOptions} value={rejectionStatusFilter} onChange={setRejectionStatusFilter} />
            <p className="text-[9px] font-mono text-muted-foreground/50">
              {filteredRejections.length === rejections.length
                ? `${rejections.length} row${rejections.length !== 1 ? 's' : ''}`
                : `Showing ${filteredRejections.length} of ${rejections.length} — `}
              {filteredRejections.length < rejections.length && (
                <button type="button" onClick={() => { setRejectionTypeFilter('all'); setRejectionStatusFilter('all'); }} className="text-xs font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link">clear filters</button>
              )}
            </p>
            <AdminBulkBar
              idsShown={rejectionIdsShown}
              selectedIds={rejectionSelectedIds}
              onSelectionChange={setRejectionSelectedIds}
              onBulkDelete={bulkDeleteRejections}
              busy={rejectionBulkBusy}
            />
            <div className="space-y-1.5 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
              {filteredRejections.map(r => (
                <RejectionEntry
                  key={r.id}
                  row={r}
                  selected={rejectionSelectedIds.has(r.id)}
                  onToggleSelect={(id, checked) => {
                    setRejectionSelectedIds((prev) => {
                      const n = new Set(prev);
                      if (checked) n.add(id);
                      else n.delete(id);
                      return n;
                    });
                  }}
                  selectDisabled={rejectionBulkBusy}
                />
              ))}
              {filteredRejections.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                  {rejections.length === 0 ? 'No failures in the latest sample' : 'No rows match filters'}
                </p>
              )}
            </div>
          </div>

          {/* User Feedback */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">User Feedback <span className="text-muted-foreground/40 normal-case">(all time)</span></p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              Thumbs from the app; timeline and deep-time zoom feedback are merged into one Zoom Out row.
            </p>
            <div className="space-y-1.5">
              {feedback.map((row, i) => {
                const pct = row.approval_pct ?? 0;
                const total = (row.total_thumbs_up ?? 0) + (row.total_thumbs_down ?? 0);
                return (
                  <div key={i} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-foreground/80">{label(row.companion_type)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-muted-foreground/50"><ThumbsUp className="h-2.5 w-2.5 inline mr-0.5" />{row.total_thumbs_up ?? 0}</span>
                        <span className="text-[9px] text-muted-foreground/50">👎 {row.total_thumbs_down ?? 0}</span>
                        <span className={`text-[10px] font-mono ${pct >= 70 ? 'text-foreground/75' : pct >= 40 ? 'text-muted-foreground/70' : 'text-destructive/70'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {total > 0 && (
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 70 ? 'bg-primary/70' : pct >= 40 ? 'bg-muted-foreground/50' : 'bg-destructive/70'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {feedback.length === 0 && <p className="text-[10px] text-muted-foreground/50 text-center py-3">No feedback data yet</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-8 mt-0">
          <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed max-w-3xl">
            <span className="text-muted-foreground/55">Pauses</span> below are rows from <code className="text-muted-foreground/50">v_pause_full</code> (completed / in-progress read model). <span className="text-muted-foreground/55">Latest cache writes</span> are new rows in <code className="text-muted-foreground/50">companion_cache</code> (cron + live writes) — same pool you manage under the Cache tab, shown here chronologically for a quick audit.
          </p>

          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Recent pauses</p>
            <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
              Green chips mean that companion slot counted for this pause. Expand for <strong className="font-normal text-muted-foreground/55">live</strong> / <strong className="font-normal text-muted-foreground/55">library</strong> / <strong className="font-normal text-muted-foreground/55">cache</strong> / <strong className="font-normal text-muted-foreground/55">curated</strong> / <strong className="font-normal text-muted-foreground/55">empty</strong> from <code className="text-muted-foreground/55">companion_serves</code> (library = curated <code className="text-muted-foreground/55">content_library</code> hit; cache = runtime <code className="text-muted-foreground/55">companion_cache</code>; n/a = no log row, e.g. older sessions).
            </p>
            <div className="space-y-1.5">
              <FilterRow label="Mood" options={sessionMoodOptions} value={sessionMoodFilter} onChange={setSessionMoodFilter} />
              <FilterRow label="Outcome" options={sessionOutcomeOptions} value={sessionOutcomeFilter} onChange={setSessionOutcomeFilter} />
              <FilterRow label="Companion" options={sessionCompanionOptions} value={sessionCompanionFilter} onChange={setSessionCompanionFilter} />
              {(sessionMoodFilter !== 'all' || sessionOutcomeFilter !== 'all' || sessionCompanionFilter !== 'all') && (
                <p className="text-[9px] font-mono text-muted-foreground/40">Showing {filteredSessions.length} of {sessions.length}</p>
              )}
            </div>
            <div className="space-y-1">
              {filteredSessions.map(s => {
                const expanded = expandedSessionId === s.id;
                const contextText = typeof s.context_snapshot?.context_text === 'string'
                  ? (s.context_snapshot.context_text as string)
                  : null;
                const counted = s.counted_companion_types ?? [];
                return (
                <div key={s.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setExpandedSessionId(expanded ? null : s.id)}
                    className="w-full text-left space-y-1.5 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                  >
                    <div className="flex items-center gap-2">
                      {expanded ? (
                        <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground/50 flex-shrink-0">
                        {new Date(s.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground/60">{s.state}</span>
                      {s.initial_mood && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-muted/50 text-foreground flex-shrink-0">
                          {s.initial_mood}
                        </span>
                      )}
                      {s.outcome && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          s.outcome === 'held' ? 'bg-muted/50 text-nox-accent-green'
                          : s.outcome === 'sold' ? 'bg-destructive/15 text-destructive'
                          : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {s.outcome}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-foreground/70 leading-relaxed pl-4">
                      {s.reflection_text?.slice(0, 100)}{(s.reflection_text?.length ?? 0) > 100 ? '…' : ''}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pl-4">
                      {[
                        { loaded: counted.includes('signal'), name: 'Signal' },
                        { loaded: counted.includes('ground_nudge'), name: 'Ground' },
                        { loaded: counted.includes('historical_insight'), name: 'History' },
                        { loaded: counted.includes('zoom_out') || counted.includes('zoom_out_deep_time'), name: 'Zoom' },
                        { loaded: !!s.haiku_text, name: 'Haiku' },
                      ].map(c => (
                        <span key={c.name} className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                          c.loaded ? 'bg-muted/50 text-nox-accent-green' : 'bg-muted/30 text-muted-foreground/40'
                        }`}>
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </button>
                  {expanded && (
                    <div className="mt-1.5 space-y-2 rounded border border-border/20 bg-card/10 px-3 py-2 text-[9px] font-mono">
                      <div className="space-y-0.5">
                        <p className="text-muted-foreground/50 uppercase tracking-wider">Reflection text</p>
                        <p className="text-foreground/70 whitespace-pre-wrap break-words leading-relaxed">{s.reflection_text ?? '—'}</p>
                      </div>
                      <div className="space-y-1.5 border-t border-border/10 pt-2">
                        <p className="text-muted-foreground/50 uppercase tracking-wider">Counted companions</p>
                        <p className="text-foreground/70">{counted.length > 0 ? counted.join(', ') : '—'}</p>
                      </div>
                      {s.haiku_text && (
                        <div className="space-y-0.5 border-t border-border/10 pt-2">
                          <p className="text-muted-foreground/40">Haiku</p>
                          <p className="text-foreground/70 whitespace-pre-wrap break-words leading-relaxed">{s.haiku_text}</p>
                        </div>
                      )}
                      <div className="space-y-0.5 border-t border-border/10 pt-2">
                        <p className="text-muted-foreground/50 uppercase tracking-wider">Context</p>
                        <p className="text-foreground/70 whitespace-pre-wrap break-words leading-relaxed">{contextText ?? '—'}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
              {filteredSessions.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                  {sessions.length === 0 ? 'No sessions yet' : 'No sessions match filters'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t border-border/15 pt-6">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              Latest cache writes <span className="text-muted-foreground/45">({recentContent.length})</span>
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/50 leading-relaxed">
              Newest rows in <code className="text-muted-foreground/60">companion_cache</code>. Bulk delete here removes pool entries (same as Cache tab).
            </p>
            <FilterRow label="Type" options={feedTypeOptions} value={feedTypeFilter} onChange={setFeedTypeFilter} />
            <p className="text-[9px] font-mono text-muted-foreground/50">
              {filteredFeed.length === recentContent.length
                ? `${recentContent.length} item${recentContent.length !== 1 ? 's' : ''}`
                : `Showing ${filteredFeed.length} of ${recentContent.length} — `}
              {filteredFeed.length < recentContent.length && (
                <button type="button" onClick={() => setFeedTypeFilter('all')} className="text-xs font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link">clear filter</button>
              )}
            </p>
            <AdminBulkBar
              idsShown={feedIdsShown}
              selectedIds={feedSelectedIds}
              onSelectionChange={setFeedSelectedIds}
              onBulkDelete={bulkDeleteFeedItems}
              busy={feedBulkBusy}
            />
            {filteredFeed.map(item => (
              <FeedCard
                key={item.id}
                item={item}
                selected={feedSelectedIds.has(item.id)}
                onToggleSelect={(id, checked) => {
                  setFeedSelectedIds((prev) => {
                    const n = new Set(prev);
                    if (checked) n.add(id);
                    else n.delete(id);
                    return n;
                  });
                }}
                selectDisabled={feedBulkBusy}
              />
            ))}
            {filteredFeed.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 text-center py-3">
                {recentContent.length === 0 ? 'No cache rows in the latest sample' : 'No items match filter'}
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-0 space-y-4">
          <SourceSuggestionsPanel onCatalogChanged={refresh} />
          <SourceCatalogViewer sources={signalSources} onRefresh={refresh} libraryEntries={libraryEntries} />
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <ContentLibraryViewer entries={libraryEntries} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="content" className="mt-0 space-y-2">
          <p className="text-[9px] font-mono text-muted-foreground/50">
            Companion cache — pregenerated and live-written pool rows. Quality score and used_count indicate how often entries are picked from the pool (after live tries and, for some companions, Library fallbacks — see copy inside the panel).
          </p>
          <CuratedContentManager entries={cacheEntries} onRefresh={refreshCacheEntries} />
        </TabsContent>

        <TabsContent value="fallbacks" className="mt-0">
          <HardcodedFallbacksManager />
        </TabsContent>

        <TabsContent value="cost" className="mt-0">
          <CostAnalytics />
        </TabsContent>

        <TabsContent value="tools" className="mt-0">
          <div className="space-y-3">
            <MigrationStatus />
            <AppConfigTools />
            <DemoModeToggle />
            <BadgeDebug />
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-[9px] text-muted-foreground/40 text-center pb-4">
        AI Companion System Monitor · Data from Supabase views
      </p>
    </div>
  );
}
