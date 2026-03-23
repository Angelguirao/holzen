import { useAdminStats, CacheEntryRow, SignalSourceRow, TimePeriod, PeriodStats, RejectionRow, RecentContentRow, SessionRow } from '@/hooks/use-admin-stats';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RefreshCw, Activity, Database, DollarSign, AlertTriangle, ThumbsUp, Clock, Loader2, Zap, ShieldX, ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';

/**
 * Admin access control.
 * 
 * Checks profiles.is_admin (server-side, used by RLS policies).
 * Falls back to VITE_ADMIN_USER_IDS env var if the DB column
 * doesn't exist yet (before migration).
 */
function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }

    // Check DB first (authoritative after migration)
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data && typeof (data as any).is_admin === 'boolean') {
          // DB column exists — use it as source of truth
          setIsAdmin((data as any).is_admin);
        } else {
          // Column doesn't exist yet — fall back to env var
          const adminIds = import.meta.env.VITE_ADMIN_USER_IDS;
          if (!adminIds) {
            setIsAdmin(true); // No restriction configured
          } else {
            setIsAdmin(adminIds.split(',').map((id: string) => id.trim()).includes(user.id));
          }
        }
        setChecked(true);
      });
  }, [user]);

  return { isAdmin, loading: authLoading || !checked };
}

const TYPE_LABELS: Record<string, string> = {
  signal: 'Signal',
  ground_nudge: 'Grounding',
  historical_insight: 'History',
  zoom_out: 'Zoom Out',
  zoom_out_deep_time: 'Zoom Out',
  reflection: 'Reflection',
  learning: 'Grounding',
  history_insight: 'History',
  haiku: 'Haiku',
};

const TYPE_COLORS: Record<string, string> = {
  signal: '#8b5cf6',
  ground_nudge: '#06b6d4',
  historical_insight: '#f59e0b',
  zoom_out: '#10b981',
  reflection: '#6366f1',
};

function label(type: string | null): string {
  return TYPE_LABELS[type ?? ''] ?? type ?? 'Unknown';
}

interface TrendInfo {
  direction: 'up' | 'down' | 'flat';
  label: string;
}

function StatCard({ icon: Icon, title, value, subtitle, alert, trend }: {
  icon: typeof Activity;
  title: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
  trend?: TrendInfo;
}) {
  const trendColor = trend
    ? trend.direction === 'flat'
      ? 'text-muted-foreground/40'
      : trend.direction === 'up'
        ? 'text-emerald-500'
        : 'text-red-500'
    : '';
  const trendArrow = trend
    ? trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '—'
    : '';

  return (
    <div className={`rounded-xl border px-4 py-3 space-y-1 ${alert ? 'border-destructive/40 bg-destructive/10' : 'border-border/30 bg-card/20'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${alert ? 'text-destructive' : 'text-muted-foreground/60'}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className={`text-lg font-mono ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
        {trend && (
          <span className={`text-[9px] font-mono ${trendColor}`}>
            {trendArrow} {trend.label}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>}
    </div>
  );
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'all', label: 'All time' },
];

function computeTrend(
  current: number,
  previous: number | null,
  invertColor: boolean,
): TrendInfo | undefined {
  if (previous === null || previous === undefined) return undefined;
  if (previous === 0 && current === 0) return undefined; // No data in either period
  if (previous === 0) return undefined; // No previous data to compare against
  const pctChange = Math.round(((current - previous) / previous) * 100);
  if (pctChange === 0) return { direction: 'flat', label: '0%' };
  const raw: 'up' | 'down' = pctChange > 0 ? 'up' : 'down';
  const displayed = invertColor ? (raw === 'up' ? 'down' : 'up') : raw;
  return { direction: displayed, label: `${Math.abs(pctChange)}%` };
}

const TAB_TRIGGER_CLASS = "text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary";

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const {
    cacheHits, costs, failures, feedback, cacheEntries, signalSources,
    period, setPeriod, periodStats, prevPeriodStats,
    rejections, recentContent, sessions,
    loading, error, refresh, refreshCacheEntries, lastUpdated,
  } = useAdminStats();

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

  // ── Cache hit rate (all-time from views) ──
  // Cache hit rate now comes from periodStats (period-aware)

  // ── Failure rate from periodStats ──
  const failureRate = periodStats.totalAttempts > 0
    ? Math.round((periodStats.failures / periodStats.totalAttempts) * 100)
    : 0;
  const prevFailureRate = prevPeriodStats && prevPeriodStats.totalAttempts > 0
    ? Math.round((prevPeriodStats.failures / prevPeriodStats.totalAttempts) * 100)
    : null;

  // ── Trends ──
  const servesTrend = computeTrend(periodStats.serves, prevPeriodStats?.serves ?? null, false);
  const cacheHitTrend = computeTrend(periodStats.cacheHitRate, prevPeriodStats?.cacheHitRate ?? null, false); // higher cache hit = good
  const costTrend = computeTrend(periodStats.cost, prevPeriodStats?.cost ?? null, true);
  const failureTrend = computeTrend(failureRate, prevFailureRate, true);

  // ── Cost chart data (last 14 days, aggregated by day) ──
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

  // ── Period label for subtitle ──
  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label.toLowerCase() ?? period;

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
          <button onClick={refresh} className="mt-2 text-[10px] font-mono text-primary/60 hover:text-primary flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/80">System Monitor</h2>
        <button onClick={refresh} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/60 hover:text-primary transition-colors">
          <RefreshCw className="h-3 w-3" />
          {lastUpdated && <span>{lastUpdated.toLocaleTimeString()}</span>}
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList className="inline-flex h-auto items-center gap-1 rounded-lg bg-muted/30 p-1">
          <TabsTrigger value="monitor" className={TAB_TRIGGER_CLASS}>Monitor</TabsTrigger>
          <TabsTrigger value="content" className={TAB_TRIGGER_CLASS}>Content</TabsTrigger>
          <TabsTrigger value="sources" className={TAB_TRIGGER_CLASS}>Sources</TabsTrigger>
          <TabsTrigger value="tools" className={TAB_TRIGGER_CLASS}>Tools</TabsTrigger>
          <TabsTrigger value="feed" className={TAB_TRIGGER_CLASS}>Feed</TabsTrigger>
          <TabsTrigger value="rejections" className={TAB_TRIGGER_CLASS}>Rejections</TabsTrigger>
        </TabsList>

        {/* Tab 1: Monitor */}
        <TabsContent value="monitor" className="space-y-6 mt-0">
          {/* Health Summary */}
          {(() => {
            const issues: string[] = [];
            const tips: string[] = [];

            if (failureRate > 20) {
              issues.push('High failure rate — check if API keys (Perplexity/Lovable) are valid and not rate-limited');
            } else if (failureRate > 5) {
              tips.push('Some generation failures — check Generation Health for details');
            }

            // Cost thresholds scale with period
            const costWarn = period === 'today' ? 8 : period === '7d' ? 50 : period === '30d' ? 200 : 999;
            const costTip = period === 'today' ? 5 : period === '7d' ? 30 : period === '30d' ? 100 : 999;
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

            if (issues.length === 0 && tips.length === 0 && periodStats.serves > 0) {
              const parts = [`${failureRate}% failure rate`];
              if (periodStats.cost > 0) parts.push(`$${periodStats.cost.toFixed(3)} cost`);
              if (periodStats.cacheHitRate > 0) parts.push(`${periodStats.cacheHitRate}% cache hit`);
              parts.push(`${periodStats.serves} serves`);
              return (
                <div className="rounded-xl border border-primary/15 bg-primary/3 px-4 py-2.5">
                  <p className="text-[10px] font-mono text-primary/60">✓ System healthy — {parts.join(' · ')}</p>
                </div>
              );
            }

            const allMessages = [
              ...issues.map(msg => ({ msg, level: 'issue' as const })),
              ...tips.map(msg => ({ msg, level: 'tip' as const })),
            ];

            if (allMessages.length > 0) {
              return (
                <div className={`rounded-xl border px-4 py-2.5 space-y-1 ${
                  issues.length > 0
                    ? 'border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10'
                    : 'border-border/20 bg-card/10'
                }`}>
                  {allMessages.map(({ msg, level }, i) => (
                    <p key={i} className={`text-[10px] font-mono ${
                      level === 'issue'
                        ? 'text-amber-700/70 dark:text-amber-400/70'
                        : 'text-muted-foreground/50'
                    }`}>
                      {level === 'issue' ? '⚠' : '💡'} {msg}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {/* Period Selector */}
          <div className="flex items-center gap-1.5">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                  period === opt.value
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={Activity}
              title="Serves"
              value={periodStats.serves.toLocaleString()}
              subtitle={periodLabel}
              trend={servesTrend}
            />
            <StatCard
              icon={Database}
              title="Cache Hit"
              value={`${periodStats.cacheHitRate}%`}
              subtitle={periodStats.cacheHitRate === 0 ? 'all live — fresh content' : periodStats.cacheHitRate < 30 ? 'mostly live generation' : 'good cache usage'}
              trend={cacheHitTrend}
            />
            <StatCard
              icon={DollarSign}
              title="Cost"
              value={`$${periodStats.cost.toFixed(3)}`}
              subtitle={periodLabel}
              alert={periodStats.cost > 8}
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
                      {costChartData.map((_, i) => (
                        <Cell key={i} fill="hsl(var(--primary) / 0.3)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cache Hit Rates (detail breakdown is always all-time from views) */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Cache Hit Rates <span className="text-muted-foreground/40 normal-case">(all time)</span></p>
            <div className="space-y-1.5">
              {cacheHits.map((row, i) => {
                const pct = row.cache_hit_pct ?? 0;
                const type = row.companion_type ?? 'unknown';
                return (
                  <div key={i} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-foreground/80">{label(type)}</span>
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        {pct.toFixed(0)}% · {row.total_serves ?? 0} serves
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: TYPE_COLORS[type] ?? 'hsl(var(--primary) / 0.4)',
                        }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] text-muted-foreground/50">live: {row.live_generated ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">cache: {row.cache_hits ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">curated: {row.curated_fallbacks ?? 0}</span>
                    </div>
                  </div>
                );
              })}
              {cacheHits.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">No serve data yet</p>
              )}
            </div>
          </div>

          {/* Generation Health (detail breakdown is always all-time from views) */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Generation Health <span className="text-muted-foreground/40 normal-case">(all time)</span></p>
            <div className="space-y-1.5">
              {failures.map((row, i) => {
                const failPct = row.failure_pct ?? 0;
                const isAlert = failPct > 20;
                return (
                  <div key={i} className={`rounded-lg border px-3 py-2 ${isAlert ? 'border-destructive/20 bg-destructive/5' : 'border-border/10 bg-card/5'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-foreground/80">{label(row.companion_type)}</span>
                        <span className="text-[9px] text-muted-foreground/50 ml-2">{row.model}</span>
                      </div>
                      <span className={`text-[10px] font-mono ${isAlert ? 'text-destructive/70' : 'text-muted-foreground/40'}`}>
                        {failPct.toFixed(1)}% fail
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] text-muted-foreground/50">✓ {row.successes ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">✗ {row.errors ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">⏱ {row.timeouts ?? 0}</span>
                      <span className="text-[9px] text-muted-foreground/50">⚠ {row.quality_gate_failures ?? 0} QG</span>
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> avg {((row.avg_latency_ms ?? 0) / 1000).toFixed(1)}s
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">
                        P95 {((row.p95_latency_ms ?? 0) / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                );
              })}
              {failures.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">No generation data yet</p>
              )}
            </div>
          </div>

          {/* Feedback (detail breakdown is always all-time from views) */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">User Feedback <span className="text-muted-foreground/40 normal-case">(all time)</span></p>
            <div className="space-y-1.5">
              {feedback.map((row, i) => (
                <div key={i} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-foreground/80">{label(row.companion_type)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/50">
                      <ThumbsUp className="h-2.5 w-2.5 inline mr-0.5" />{row.total_thumbs_up ?? 0}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50">
                      👎 {row.total_thumbs_down ?? 0}
                    </span>
                    <span className="text-[10px] font-mono text-primary/50">
                      {(row.approval_pct ?? 0).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {feedback.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">No feedback data yet</p>
              )}
            </div>
          </div>

          {/* Sessions Timeline */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">Recent Sessions</p>
            <div className="space-y-1">
              {sessions.map(s => (
                <div key={s.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground/30 flex-shrink-0">
                    {new Date(s.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {s.mood && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/60 flex-shrink-0">
                      {s.mood}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-foreground/50 truncate flex-1 min-w-0">
                    {s.message?.slice(0, 60)}{(s.message?.length ?? 0) > 60 ? '…' : ''}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                    {[
                      { loaded: !!s.signal_title, name: 'Signal' },
                      { loaded: !!s.learning_title, name: 'Ground' },
                      { loaded: !!s.history_insight_data, name: 'History' },
                      { loaded: !!s.zoom_out_data, name: 'Zoom' },
                      { loaded: !!s.haiku, name: 'Haiku' },
                    ].map(c => (
                      <span key={c.name} className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                        c.loaded ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted/20 text-muted-foreground/40'
                      }`}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-[10px] text-muted-foreground/50 text-center py-3">No sessions yet</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Content */}
        <TabsContent value="content" className="mt-0">
          <CuratedContentManager entries={cacheEntries} onRefresh={refreshCacheEntries} />
        </TabsContent>

        {/* Tab 3: Sources */}
        <TabsContent value="sources" className="mt-0">
          <SourceCatalogViewer sources={signalSources} onRefresh={refresh} />
        </TabsContent>

        {/* Tab 4: Tools */}
        <TabsContent value="tools" className="mt-0">
          <DevModeToggle />
        </TabsContent>

        {/* Tab 5: Feed */}
        <TabsContent value="feed" className="space-y-3 mt-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
            Recent Content <span className="text-muted-foreground/45">({recentContent.length})</span>
          </p>
          {recentContent.map(item => (
            <FeedCard key={item.id} item={item} />
          ))}
          {recentContent.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No content generated yet</p>
          )}
        </TabsContent>

        {/* Tab 6: Rejections */}
        <TabsContent value="rejections" className="space-y-3 mt-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
            Quality Gate Failures <span className="text-muted-foreground/45">({rejections.length})</span>
          </p>
          <div className="space-y-1.5">
            {rejections.map(r => (
              <RejectionEntry key={r.id} row={r} />
            ))}
            {rejections.length === 0 && (
              <p className="text-[10px] text-muted-foreground/50 text-center py-3">No rejections</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground/40 text-center pb-4">
        AI Companion System Monitor · Data from Supabase views
      </p>
    </div>
  );
}

// ── Feed Card (expandable) ──
function FeedCard({ item }: { item: RecentContentRow }) {
  const [expanded, setExpanded] = useState(false);
  const body = typeof item.content === 'string'
    ? item.content
    : typeof item.content?.body === 'string'
      ? item.content.body
      : JSON.stringify(item.content);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1 transition-colors hover:bg-card/10"
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `${TYPE_COLORS[item.companion_type] ?? '#64748b'}20`,
            color: TYPE_COLORS[item.companion_type] ?? '#64748b',
          }}
        >
          {label(item.companion_type)}
        </span>
        <span className="text-[10px] font-mono text-foreground/80 truncate flex-1 min-w-0">
          {item.title || '(untitled)'}
        </span>
        <QualityBadge score={item.quality_score} />
        {expanded ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" /> : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />}
      </div>
      <p className="text-[9px] font-mono text-muted-foreground/40 truncate">
        {expanded ? body : body?.slice(0, 100)}{!expanded && (body?.length ?? 0) > 100 ? '…' : ''}
      </p>
      <div className="flex items-center gap-3">
        {item.source_author && <span className="text-[9px] text-muted-foreground/50">by {item.source_author}</span>}
        <span className="text-[9px] text-muted-foreground/45">{new Date(item.created_at).toLocaleDateString()}</span>
        <span className="text-[9px] text-muted-foreground/45">used: {item.used_count}</span>
      </div>
      {expanded && (
        <div className="pt-1 border-t border-border/5">
          <p className="text-[9px] font-mono text-foreground/40 whitespace-pre-wrap break-words">{body}</p>
        </div>
      )}
    </button>
  );
}

// ── Rejection Entry ──
function RejectionEntry({ row }: { row: RejectionRow }) {
  const statusColor: Record<string, string> = {
    error: 'bg-red-500/15 text-red-600 dark:text-red-400',
    timeout: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    quality_gate_failed: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `${TYPE_COLORS[row.companion_type] ?? '#64748b'}20`,
            color: TYPE_COLORS[row.companion_type] ?? '#64748b',
          }}
        >
          {label(row.companion_type)}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/30">{row.model}</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${statusColor[row.status] ?? 'bg-muted/20 text-muted-foreground/40'}`}>
          {row.status}
        </span>
        <span className="text-[9px] text-muted-foreground/45 ml-auto flex-shrink-0">
          {new Date(row.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[9px] font-mono text-muted-foreground/40 truncate">
          {row.quality_gate_reason || row.error_message || '—'}
        </span>
        {row.latency_ms != null && (
          <span className="text-[9px] text-muted-foreground/50 flex-shrink-0 flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {(row.latency_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}

// ── Quality score visual indicator ──
function QualityBadge({ score }: { score: number }) {
  if (score >= 3) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">curated</span>;
  if (score >= 2) return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">good</span>;
  return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">low</span>;
}

function CuratedContentManager({ entries, onRefresh }: { entries: CacheEntryRow[]; onRefresh: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, CacheEntryRow[]>();
    for (const e of entries) {
      const key = e.companion_type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const promote = useCallback(async (id: string) => {
    setActing(id);
    await supabase.from('companion_cache').update({ quality_score: 3, expires_at: null } as any).eq('id', id);
    await onRefresh();
    setActing(null);
  }, [onRefresh]);

  const demote = useCallback(async (id: string) => {
    setActing(id);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('companion_cache').update({ quality_score: 1, expires_at: expires } as any).eq('id', id);
    await onRefresh();
    setActing(null);
  }, [onRefresh]);

  const remove = useCallback(async (id: string) => {
    if (!window.confirm('Delete this cache entry? This cannot be undone.')) return;
    setActing(id);
    await supabase.from('companion_cache').delete().eq('id', id);
    await onRefresh();
    setActing(null);
  }, [onRefresh]);

  return (
    <div className="space-y-3">
      {/* Explanation */}
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          Content that AI generates gets cached here. You can manage its lifecycle:
        </p>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">↑ Promote</span> — Makes content permanent (never expires). Best content gets served as fallback when AI is down.
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-orange-600 dark:text-orange-400 font-mono">↓ Demote</span> — Lowers quality score and sets 7-day expiry. For content that isn't good enough.
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-destructive font-mono">🗑 Delete</span> — Permanently removes from cache.
          </p>
        </div>
        <p className="text-[9px] text-muted-foreground/50">
          Quality badges: <span className="text-emerald-600 dark:text-emerald-400">curated</span> = permanent, <span className="text-blue-600 dark:text-blue-400">good</span> = verified URL, <span className="text-orange-600 dark:text-orange-400">low</span> = unverified
        </p>
      </div>

      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Cache Entries <span className="text-muted-foreground/45">({entries.length})</span>
        </p>
      </button>
      {open && (
        <div className="space-y-3">
          {grouped.map(([type, items]) => (
            <div key={type} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[type] ?? 'hsl(var(--primary) / 0.4)' }}
                />
                <span className="text-[10px] font-mono text-foreground/80">{label(type)}</span>
                <span className="text-[9px] text-muted-foreground/50">{items.length} entries</span>
              </div>
              {items.map(entry => {
                const isPermanent = entry.expires_at === null;
                const isCurated = entry.quality_score >= 3;
                const isActing = acting === entry.id;
                return (
                  <div key={entry.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-foreground/70 truncate">{entry.title || '(untitled)'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <QualityBadge score={entry.quality_score} />
                          {isPermanent && <span className="text-[9px] font-mono text-muted-foreground/40">♾ permanent</span>}
                          {!isPermanent && entry.expires_at && (
                            <span className="text-[9px] font-mono text-muted-foreground/30">
                              expires {new Date(entry.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[9px] text-muted-foreground/50">used: {entry.used_count}</span>
                      {(entry.thumbs_up != null || entry.thumbs_down != null) && (
                        <>
                          <span className="text-[9px] text-muted-foreground/50">👍 {entry.thumbs_up ?? 0}</span>
                          <span className="text-[9px] text-muted-foreground/50">👎 {entry.thumbs_down ?? 0}</span>
                        </>
                      )}
                      <span className="text-[9px] text-muted-foreground/45">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {!isCurated && (
                        <button
                          onClick={() => promote(entry.id)}
                          disabled={isActing}
                          className="flex items-center gap-0.5 text-[9px] font-mono text-emerald-600/70 dark:text-emerald-400/70 hover:text-emerald-600 dark:hover:text-emerald-400 disabled:opacity-30 transition-colors"
                        >
                          <ArrowUp className="h-2.5 w-2.5" /> Promote
                        </button>
                      )}
                      {(isCurated || entry.quality_score >= 2) && (
                        <button
                          onClick={() => demote(entry.id)}
                          disabled={isActing}
                          className="flex items-center gap-0.5 text-[9px] font-mono text-orange-600/70 dark:text-orange-400/70 hover:text-orange-600 dark:hover:text-orange-400 disabled:opacity-30 transition-colors"
                        >
                          <ArrowDown className="h-2.5 w-2.5" /> Demote
                        </button>
                      )}
                      <button
                        onClick={() => remove(entry.id)}
                        disabled={isActing}
                        className="flex items-center gap-0.5 text-[9px] font-mono text-destructive/50 hover:text-destructive/80 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" /> Delete
                      </button>
                      {isActing && <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground/30 ml-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No cache entries</p>
          )}
        </div>
      )}
    </div>
  );
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  blog: '#8b5cf6',
  podcast: '#06b6d4',
  book: '#f59e0b',
  newsletter: '#10b981',
  twitter: '#6366f1',
  video: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  signal: 'Signal',
  grounding: 'Grounding',
  learning: 'Learning',
};

function SourceCatalogViewer({ sources, onRefresh }: { sources: SignalSourceRow[]; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('blog');
  const [newCategory, setNewCategory] = useState('signal');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, SignalSourceRow[]>();
    for (const s of sources) {
      const key = s.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sources]);

  const addSource = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await supabase.from('signal_sources').insert({
      name: newName.trim(),
      url: newUrl.trim() || null,
      type: newType,
      category: newCategory,
    } as any);
    setNewName('');
    setNewUrl('');
    setAdding(false);
    setSaving(false);
    onRefresh();
  };

  const deleteSource = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from sources?`)) return;
    await supabase.from('signal_sources').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {/* Explanation */}
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          Sources the AI searches when generating Signal and Grounding companions.
        </p>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground/60">
            <span className="font-mono font-medium">signal</span> sources — Bitcoin thinkers, essayists, publications for philosophical insights
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="font-mono font-medium">grounding</span> sources — Academic researchers, behavioral finance journals
          </p>
        </div>
      </div>

      {/* Add new source */}
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
        >
          + Add source
        </button>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Source name (e.g. Parker Lewis)"
            className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40"
          />
          <input
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="URL (optional)"
            className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40"
          />
          <div className="flex gap-2">
            <select value={newType} onChange={e => setNewType(e.target.value)} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5">
              <option value="blog">blog</option>
              <option value="book">book</option>
              <option value="podcast">podcast</option>
              <option value="essay">essay</option>
              <option value="academic">academic</option>
            </select>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5">
              <option value="signal">signal</option>
              <option value="grounding">grounding</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addSource} disabled={saving || !newName.trim()} className="text-[10px] font-mono text-primary hover:text-primary/80 disabled:opacity-30">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Source Catalog <span className="text-muted-foreground/45">({sources.length})</span>
        </p>
      </button>
      {open && (
        <div className="space-y-3">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-mono text-foreground/80">{CATEGORY_LABELS[category] ?? category}</span>
              {items.map(src => (
                <div key={src.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-foreground/80 truncate">{src.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${SOURCE_TYPE_COLORS[src.type] ?? '#64748b'}20`,
                          color: SOURCE_TYPE_COLORS[src.type] ?? '#64748b',
                        }}
                      >
                        {src.type}
                      </span>
                      {src.url && (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-primary/60 hover:text-primary flex items-center gap-0.5 truncate transition-colors"
                        >
                          <Globe className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{src.url.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSource(src.id, src.name)}
                    className="text-destructive/40 hover:text-destructive transition-colors flex-shrink-0"
                    title="Remove source"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ))}
          {sources.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No sources configured</p>
          )}
        </div>
      )}
    </div>
  );
}

function DevModeToggle() {
  const [devMode, setDevMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    try {
      setDevMode(localStorage.getItem('holzen_dev_mode') === 'true');
    } catch { /* ignore */ }

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('analytics_events')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('event', 'dev_mode_setting')
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data.length > 0) {
          const dbValue = (data[0].metadata as any)?.enabled === true;
          setDevMode(dbValue);
          try {
            if (dbValue) localStorage.setItem('holzen_dev_mode', 'true');
            else localStorage.removeItem('holzen_dev_mode');
          } catch { /* ignore */ }
        }
      } catch { /* non-critical */ }
    })();
  }, []);

  const toggle = async () => {
    const next = !devMode;
    setDevMode(next);
    setSyncing(true);
    try {
      if (next) localStorage.setItem('holzen_dev_mode', 'true');
      else localStorage.removeItem('holzen_dev_mode');
    } catch { /* ignore */ }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event: 'dev_mode_setting',
          metadata: { enabled: next },
        });
      }
    } catch { /* non-critical */ }
    setSyncing(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Dev Tools</p>
      <button
        onClick={toggle}
        className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
          devMode
            ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10'
            : 'border-border/15 bg-card/10 hover:bg-card/20'
        }`}
      >
        <Zap className={`h-3.5 w-3.5 ${devMode ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground/30'}`} />
        <div className="flex-1 text-left">
          <p className={`text-[10px] font-mono ${devMode ? 'text-amber-700 dark:text-amber-300' : 'text-foreground/60'}`}>
            Rapid Testing Mode {syncing && '…'}
          </p>
          <p className="text-[9px] text-muted-foreground/40">
            {devMode ? '5s cooldown between pauses (active)' : '15min cooldown between pauses (normal)'}
          </p>
        </div>
        <span className={`text-[9px] font-mono ${devMode ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/30'}`}>
          {devMode ? 'ON' : 'OFF'}
        </span>
      </button>
      {devMode && (
        <p className="text-[9px] text-amber-700/50 dark:text-amber-400/50 px-1">
          ⚡ Generate pause sessions rapidly to gather data. Each session costs ~$0.01-0.05 in API calls. Disable when done testing.
        </p>
      )}
    </div>
  );
}
