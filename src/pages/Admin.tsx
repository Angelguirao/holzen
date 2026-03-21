import { useAdminStats, CacheEntryRow, SignalSourceRow } from '@/hooks/use-admin-stats';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Activity, Database, DollarSign, AlertTriangle, ThumbsUp, Clock, Loader2, Zap, ShieldX, ChevronDown, ChevronRight, Trash2, ArrowUp, ArrowDown, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';

/**
 * Admin access control.
 * Set VITE_ADMIN_USER_IDS in .env as a comma-separated list of Supabase user UUIDs.
 * If not set, falls back to allowing any authenticated user (dev convenience).
 */
function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading } = useAuth();

  if (loading) return { isAdmin: false, loading: true };
  if (!user) return { isAdmin: false, loading: false };

  const adminIds = import.meta.env.VITE_ADMIN_USER_IDS;
  if (!adminIds) {
    // No admin list configured — allow any authenticated user (backwards compatible)
    return { isAdmin: true, loading: false };
  }

  const allowedIds = adminIds.split(',').map((id: string) => id.trim());
  return { isAdmin: allowedIds.includes(user.id), loading: false };
}

const TYPE_LABELS: Record<string, string> = {
  // Canonical DB types
  signal: 'Signal',
  ground_nudge: 'Grounding',
  historical_insight: 'History',
  zoom_out: 'Zoom Out',
  zoom_out_deep_time: 'Zoom Out',
  reflection: 'Reflection',
  // Frontend keys (used in older feedback events)
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

function StatCard({ icon: Icon, title, value, subtitle, alert }: {
  icon: typeof Activity;
  title: string;
  value: string;
  subtitle?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 space-y-1 ${alert ? 'border-destructive/30 bg-destructive/5' : 'border-border/15 bg-card/10'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${alert ? 'text-destructive/60' : 'text-muted-foreground/40'}`} />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">{title}</span>
      </div>
      <p className={`text-lg font-mono ${alert ? 'text-destructive/80' : 'text-foreground/80'}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/40">{subtitle}</p>}
    </div>
  );
}

export default function Admin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { cacheHits, costs, failures, feedback, cacheEntries, signalSources, loading, error, refresh, refreshCacheEntries, lastUpdated } = useAdminStats();

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
        <ShieldX className="h-8 w-8 text-muted-foreground/20 mx-auto" />
        <p className="text-xs font-mono text-muted-foreground/40">Admin access required</p>
      </div>
    );
  }

  // ── Aggregate overview metrics ──
  const overview = useMemo(() => {
    const totalServes = cacheHits.reduce((s, r) => s + (r.total_serves ?? 0), 0);
    const totalCacheHits = cacheHits.reduce((s, r) => s + (r.cache_hits ?? 0), 0);
    const cacheHitRate = totalServes > 0 ? Math.round((totalCacheHits / totalServes) * 100) : 0;

    const today = new Date().toISOString().slice(0, 10);
    const todayCost = costs
      .filter(r => r.day?.startsWith(today))
      .reduce((s, r) => s + (r.total_cost_usd ?? 0), 0);

    const totalAttempts = failures.reduce((s, r) => s + (r.total_attempts ?? 0), 0);
    const totalErrors = failures.reduce((s, r) => s + (r.errors ?? 0) + (r.timeouts ?? 0), 0);
    const failureRate = totalAttempts > 0 ? Math.round((totalErrors / totalAttempts) * 100) : 0;

    return { totalServes, cacheHitRate, todayCost, failureRate };
  }, [cacheHits, costs, failures]);

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
      .map(([day, data]) => ({ day: day.slice(5), ...data })) // MM-DD format
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-14);
  }, [costs]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/60">System Monitor</h2>
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
        <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/60">System Monitor</h2>
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
        <h2 className="text-xs font-mono tracking-widest uppercase text-muted-foreground/60">System Monitor</h2>
        <button onClick={refresh} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40 hover:text-primary/60 transition-colors">
          <RefreshCw className="h-3 w-3" />
          {lastUpdated && <span>{lastUpdated.toLocaleTimeString()}</span>}
        </button>
      </div>

      {/* Health Summary — context-aware, not just threshold-based */}
      {(() => {
        const issues: string[] = [];
        const tips: string[] = [];

        // Failure rate — always important
        if (overview.failureRate > 20) {
          issues.push('High failure rate — check if API keys (Perplexity/Lovable) are valid and not rate-limited');
        } else if (overview.failureRate > 5) {
          tips.push('Some generation failures — check Generation Health for details');
        }

        // Cost — warn when approaching budget
        if (overview.todayCost > 8) {
          issues.push('Approaching daily budget cap ($10) — generation will be blocked when exceeded');
        } else if (overview.todayCost > 5) {
          tips.push(`Moderate spend today ($${overview.todayCost.toFixed(2)}) — on track for budget cap`);
        }

        // Cache hit rate — only relevant at higher volume or cost
        if (overview.cacheHitRate < 10 && overview.todayCost > 3) {
          tips.push('Low cache hit rate with moderate cost — consider scheduling the cache warmer cron to reduce API spend');
        } else if (overview.cacheHitRate < 10 && overview.totalServes > 50) {
          tips.push('Cache hit rate is low — the cache warmer (pregenerate-companions) could help as usage grows');
        }

        if (issues.length === 0 && tips.length === 0 && overview.totalServes > 0) {
          const parts = [`${overview.failureRate}% failure rate`];
          if (overview.todayCost > 0) parts.push(`$${overview.todayCost.toFixed(3)} today`);
          if (overview.cacheHitRate > 0) parts.push(`${overview.cacheHitRate}% cache hit`);
          parts.push(`${overview.totalServes} serves`);
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

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Activity}
          title="Serves"
          value={overview.totalServes.toLocaleString()}
          subtitle="all time"
        />
        <StatCard
          icon={Database}
          title="Cache Hit"
          value={`${overview.cacheHitRate}%`}
          subtitle={overview.cacheHitRate === 0 ? 'all live — fresh content' : overview.cacheHitRate < 30 ? 'mostly live generation' : 'good cache usage'}
        />
        <StatCard
          icon={DollarSign}
          title="Cost Today"
          value={`$${overview.todayCost.toFixed(3)}`}
          subtitle="cap: $10/day"
          alert={overview.todayCost > 8}
        />
        <StatCard
          icon={AlertTriangle}
          title="Failure Rate"
          value={`${overview.failureRate}%`}
          subtitle="target: <10%"
          alert={overview.failureRate > 20}
        />
      </div>

      {/* Cost Chart */}
      {costChartData.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Daily Cost (14d)</p>
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

      {/* Cache Hit Rates */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Cache Hit Rates</p>
        <div className="space-y-1.5">
          {cacheHits.map((row, i) => {
            const pct = row.cache_hit_pct ?? 0;
            const type = row.companion_type ?? 'unknown';
            return (
              <div key={i} className="rounded-lg border border-border/10 bg-card/5 px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-foreground/60">{label(type)}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/40">
                    {pct.toFixed(0)}% · {row.total_serves ?? 0} serves
                  </span>
                </div>
                <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: TYPE_COLORS[type] ?? 'hsl(var(--primary) / 0.4)',
                    }}
                  />
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-[9px] text-muted-foreground/30">live: {row.live_generated ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground/30">cache: {row.cache_hits ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground/30">curated: {row.curated_fallbacks ?? 0}</span>
                </div>
              </div>
            );
          })}
          {cacheHits.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 text-center py-3">No serve data yet</p>
          )}
        </div>
      </div>

      {/* Generation Health */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Generation Health</p>
        <div className="space-y-1.5">
          {failures.map((row, i) => {
            const failPct = row.failure_pct ?? 0;
            const isAlert = failPct > 20;
            return (
              <div key={i} className={`rounded-lg border px-3 py-2 ${isAlert ? 'border-destructive/20 bg-destructive/5' : 'border-border/10 bg-card/5'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-foreground/60">{label(row.companion_type)}</span>
                    <span className="text-[9px] text-muted-foreground/30 ml-2">{row.model}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${isAlert ? 'text-destructive/70' : 'text-muted-foreground/40'}`}>
                    {failPct.toFixed(1)}% fail
                  </span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-[9px] text-muted-foreground/30">✓ {row.successes ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground/30">✗ {row.errors ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground/30">⏱ {row.timeouts ?? 0}</span>
                  <span className="text-[9px] text-muted-foreground/30">⚠ {row.quality_gate_failures ?? 0} QG</span>
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[9px] text-muted-foreground/30 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> avg {((row.avg_latency_ms ?? 0) / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[9px] text-muted-foreground/30">
                    P95 {((row.p95_latency_ms ?? 0) / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            );
          })}
          {failures.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 text-center py-3">No generation data yet</p>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">User Feedback</p>
        <div className="space-y-1.5">
          {feedback.map((row, i) => (
            <div key={i} className="rounded-lg border border-border/10 bg-card/5 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-foreground/60">{label(row.companion_type)}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/30">
                  <ThumbsUp className="h-2.5 w-2.5 inline mr-0.5" />{row.total_thumbs_up ?? 0}
                </span>
                <span className="text-[9px] text-muted-foreground/30">
                  👎 {row.total_thumbs_down ?? 0}
                </span>
                <span className="text-[10px] font-mono text-primary/50">
                  {(row.approval_pct ?? 0).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
          {feedback.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 text-center py-3">No feedback data yet</p>
          )}
        </div>
      </div>

      {/* Curated Content Manager */}
      <CuratedContentManager entries={cacheEntries} onRefresh={refreshCacheEntries} />

      {/* Source Catalog */}
      <SourceCatalogViewer sources={signalSources} />

      {/* Dev Mode */}
      <DevModeToggle />

      {/* Footer */}
      <p className="text-[9px] text-muted-foreground/20 text-center pb-4">
        AI Companion System Monitor · Data from Supabase views
      </p>
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
    <div className="space-y-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
          Curated Content <span className="text-muted-foreground/25">({entries.length})</span>
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
                <span className="text-[10px] font-mono text-foreground/60">{label(type)}</span>
                <span className="text-[9px] text-muted-foreground/30">{items.length} entries</span>
              </div>
              {items.map(entry => {
                const isPermanent = entry.expires_at === null;
                const isCurated = entry.quality_score >= 3;
                const isActing = acting === entry.id;
                return (
                  <div key={entry.id} className="rounded-lg border border-border/10 bg-card/5 px-3 py-2 space-y-1.5">
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
                      <span className="text-[9px] text-muted-foreground/30">used: {entry.used_count}</span>
                      {(entry.thumbs_up != null || entry.thumbs_down != null) && (
                        <>
                          <span className="text-[9px] text-muted-foreground/30">👍 {entry.thumbs_up ?? 0}</span>
                          <span className="text-[9px] text-muted-foreground/30">👎 {entry.thumbs_down ?? 0}</span>
                        </>
                      )}
                      <span className="text-[9px] text-muted-foreground/25">{new Date(entry.created_at).toLocaleDateString()}</span>
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
            <p className="text-[10px] text-muted-foreground/30 text-center py-3">No cache entries</p>
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

function SourceCatalogViewer({ sources }: { sources: SignalSourceRow[] }) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, SignalSourceRow[]>();
    for (const s of sources) {
      const key = s.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sources]);

  return (
    <div className="space-y-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
          Source Catalog <span className="text-muted-foreground/25">({sources.length})</span>
        </p>
      </button>
      {open && (
        <div className="space-y-3">
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-mono text-foreground/60">{CATEGORY_LABELS[category] ?? category}</span>
              {items.map(src => (
                <div key={src.id} className="rounded-lg border border-border/10 bg-card/5 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-foreground/70 truncate">{src.name}</p>
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
                          className="text-[9px] text-primary/40 hover:text-primary/70 flex items-center gap-0.5 truncate transition-colors"
                        >
                          <Globe className="h-2.5 w-2.5 flex-shrink-0" />
                          <span className="truncate">{src.url.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {sources.length === 0 && (
            <p className="text-[10px] text-muted-foreground/30 text-center py-3">No sources configured</p>
          )}
        </div>
      )}
    </div>
  );
}

function DevModeToggle() {
  const [devMode, setDevMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load from localStorage first (instant), then sync from DB (cross-device)
  useEffect(() => {
    try {
      setDevMode(localStorage.getItem('holzen_dev_mode') === 'true');
    } catch { /* ignore */ }

    // Sync from DB for cross-device support
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
      // Save to localStorage (instant, same device)
      if (next) localStorage.setItem('holzen_dev_mode', 'true');
      else localStorage.removeItem('holzen_dev_mode');
    } catch { /* ignore */ }
    try {
      // Save to DB (syncs across devices)
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
