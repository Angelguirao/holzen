/**
 * Admin Cost tab.
 *
 * Surfaces that aren't in the Monitor tab:
 *   - Per-feature spend breakdown (not just by companion_type) over a time window.
 *   - Top-N users by cost in the last 7 days (abuse surface).
 *   - 7-day projected monthly spend extrapolated from the current burn rate.
 *   - Attempt-logging coverage: which AI features have landed rows in the last
 *     7 days. Missing features flag that something shipped without logging —
 *     means the budget-ceiling check below reads as "always safe" for that
 *     path even when it isn't.
 *
 * All queries hit `generation_attempts` directly (admin RLS allows SELECT).
 * Attempt rows use TanStack Query (per-period key + 7d when period ≠ 7d); refresh invalidates attempts + MRR snapshot.
 */
import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { PERIOD_OPTIONS, TAB_TRIGGER_CLASS, label } from '@/components/admin/admin-constants';
import type { TimePeriod } from '@/lib/admin-stats-bundle-query';
import { PRICING } from '@/lib/pricing';
import {
  ADMIN_COST_MRR_SNAPSHOT_QUERY_KEY,
  type AttemptRow,
  getAdminCostGenerationAttempts7dShadowQueryOptions,
  getAdminCostGenerationAttemptsQueryOptions,
  getAdminCostMrrSnapshotQueryOptions,
  type MrrSnapshot,
} from '@/lib/admin-cost-analytics-query';
import { ProviderHealthCard } from '@/components/admin/ProviderHealthCard';

/** All AI features we expect to see logging in `generation_attempts`. */
const EXPECTED_FEATURES = [
  'reflection',
  'signal',
  'grounding',
  'history',
  'zoom_out',
  'intervention',
  'journal_prompt',
  'suggest_grounding',
  'suggest_ritual',
  'wallpaper',
  'night_reflection',
  'reflection_insights',
  'digest',
  'reports',
  'admin_library_preview',
  'pregenerate',
  'fetch_source_feeds',
] as const;

interface FeatureStat {
  feature: string;
  attempts: number;
  costUsd: number;
  avgCostUsd: number;
}

interface UserStat {
  userId: string;
  costUsd: number;
  attempts: number;
  topFeature: string;
}

function summarizeByFeature(rows: AttemptRow[]): FeatureStat[] {
  const acc = new Map<string, { attempts: number; cost: number }>();
  for (const r of rows) {
    const key = r.companion_type ?? 'unknown';
    const prev = acc.get(key) ?? { attempts: 0, cost: 0 };
    prev.attempts += 1;
    prev.cost += Number(r.estimated_cost_usd ?? 0);
    acc.set(key, prev);
  }
  return Array.from(acc.entries())
    .map(([feature, v]) => ({
      feature,
      attempts: v.attempts,
      costUsd: v.cost,
      avgCostUsd: v.attempts > 0 ? v.cost / v.attempts : 0,
    }))
    .sort((a, b) => b.costUsd - a.costUsd);
}

function summarizeByUser(rows: AttemptRow[], topN = 20): UserStat[] {
  const acc = new Map<string, { cost: number; attempts: number; features: Map<string, number> }>();
  for (const r of rows) {
    if (!r.user_id) continue;
    const prev = acc.get(r.user_id) ?? { cost: 0, attempts: 0, features: new Map<string, number>() };
    prev.cost += Number(r.estimated_cost_usd ?? 0);
    prev.attempts += 1;
    const f = r.companion_type ?? 'unknown';
    prev.features.set(f, (prev.features.get(f) ?? 0) + 1);
    acc.set(r.user_id, prev);
  }
  return Array.from(acc.entries())
    .map(([userId, v]) => {
      let top = 'unknown';
      let topCount = 0;
      for (const [feat, count] of v.features.entries()) {
        if (count > topCount) { top = feat; topCount = count; }
      }
      return { userId, costUsd: v.cost, attempts: v.attempts, topFeature: top };
    })
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, topN);
}

function loggedFeatures(rows: AttemptRow[]): Set<string> {
  const s = new Set<string>();
  for (const r of rows) if (r.companion_type) s.add(r.companion_type);
  return s;
}

export function CostAnalytics() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<TimePeriod>('7d');

  const { data: mrr, isPending: mrrPending } = useQuery(getAdminCostMrrSnapshotQueryOptions());

  const {
    data: rowsPeriod = [],
    isFetching: periodAttemptsFetching,
  } = useQuery(getAdminCostGenerationAttemptsQueryOptions(period));

  const {
    data: rows7dSeparate = [],
    isFetching: sevenDayAttemptsFetching,
  } = useQuery(getAdminCostGenerationAttempts7dShadowQueryOptions(period));

  const rows7d = period === '7d' ? rowsPeriod : rows7dSeparate;
  const loading =
    periodAttemptsFetching || (period !== '7d' && sevenDayAttemptsFetching);

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ['admin', 'cost', 'generation-attempts'],
    });
    await queryClient.invalidateQueries({ queryKey: ADMIN_COST_MRR_SNAPSHOT_QUERY_KEY });
  }, [queryClient]);

  const features = useMemo(() => summarizeByFeature(rowsPeriod), [rowsPeriod]);
  const topUsers = useMemo(() => summarizeByUser(rows7d), [rows7d]);
  const totalCost = useMemo(
    () => features.reduce((s, f) => s + f.costUsd, 0),
    [features],
  );

  const totalCost7d = useMemo(
    () => rows7d.reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0),
    [rows7d],
  );
  const projectedMonthly = useMemo(() => (totalCost7d / 7) * 30, [totalCost7d]);

  const logged = useMemo(() => loggedFeatures(rows7d), [rows7d]);
  const missingCoverage = useMemo(
    () => EXPECTED_FEATURES.filter((f) => !logged.has(f)),
    [logged],
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
          Cost analytics
        </h3>
        <button
          onClick={() => void refreshAll()}
          className="flex items-center gap-1 text-[10px] font-sans font-medium text-muted-foreground/50 hover:text-nox-text-link"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      {/* Period + projected monthly */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                period === opt.value
                  ? 'bg-muted/60 text-foreground'
                  : 'text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-muted/20'
              } ${TAB_TRIGGER_CLASS.includes('ring') ? '' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={DollarSign}
            title="Period cost"
            value={`$${totalCost.toFixed(3)}`}
            sub={loading ? '…' : `${features.reduce((s, f) => s + f.attempts, 0)} logged attempts`}
          />
          <StatCard
            icon={TrendingUp}
            title="Projected monthly"
            value={`$${projectedMonthly.toFixed(2)}`}
            sub={`at 7d burn of $${(totalCost7d / 7).toFixed(3)}/day`}
          />
        </div>
      </div>

      {/* Unit economics */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Unit economics <span className="text-muted-foreground/40 normal-case">(this month)</span>
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          Active MRR (active + trialing × ${PRICING.monthlyPrice}/mo) vs. month-to-date AI spend.
          Ratio &gt; 25% means AI cost is eating a large slice of revenue — worth rethinking
          defaults before the hard cap fires.
        </p>
        <MrrCard snapshot={mrr ?? null} loading={mrrPending} />
      </section>

      {/* Provider health (circuit breakers) */}
      <ProviderHealthCard />

      {/* Per-feature breakdown */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Spend by feature <span className="text-muted-foreground/40 normal-case">({period})</span>
        </p>
        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
            <span className="text-[10px] font-mono text-muted-foreground/50">loading…</span>
          </div>
        ) : features.length === 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground/50 py-3 text-center">
            No cost data in this window.
          </p>
        ) : (
          <div className="space-y-1.5">
            {features.map((f) => {
              const pct = totalCost > 0 ? (f.costUsd / totalCost) * 100 : 0;
              return (
                <div key={f.feature} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-foreground/80">{label(f.feature)}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      ${f.costUsd.toFixed(4)} · {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/50"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[9px] text-muted-foreground/50">{f.attempts} calls</span>
                    <span className="text-[9px] text-muted-foreground/50">
                      avg ${f.avgCostUsd.toFixed(5)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top users */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Top users by cost <span className="text-muted-foreground/40 normal-case">(7d)</span>
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          Abuse surface. Normal Pro users should sit well under the per-user daily cap. A single
          row near or past the cap is the usual early signal that a bot, script, or shared account
          is burning credits.
        </p>
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
        ) : topUsers.length === 0 ? (
          <p className="text-[10px] font-mono text-muted-foreground/50 py-3 text-center">
            No user-attributed cost in last 7 days.
          </p>
        ) : (
          <div className="space-y-1">
            {topUsers.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-3 rounded-lg border border-border/15 bg-card/5 px-3 py-1.5"
              >
                <Users className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                <code className="text-[9px] font-mono text-muted-foreground/70 flex-shrink-0">
                  {u.userId.slice(0, 8)}…
                </code>
                <span className="flex-1 text-[9px] font-mono text-muted-foreground/50">
                  {u.attempts} calls · top: {u.topFeature}
                </span>
                <span className="text-[10px] font-mono text-foreground/70 flex-shrink-0">
                  ${u.costUsd.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Logging coverage */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Attempt-logging coverage <span className="text-muted-foreground/40 normal-case">(7d)</span>
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          Features expected to write to <code className="text-muted-foreground/55">generation_attempts</code>.
          A missing row below means either the feature hasn&apos;t been used in 7 days, or it ships
          without logging (per-user daily caps can&apos;t enforce on untracked spend — investigate).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXPECTED_FEATURES.map((f) => {
            const ok = logged.has(f);
            return (
              <span
                key={f}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  ok ? 'bg-muted/50 text-nox-accent-green' : 'bg-muted/30 text-muted-foreground/50'
                }`}
              >
                {ok ? '✓' : '·'} {f}
              </span>
            );
          })}
        </div>
        {missingCoverage.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-muted/30 bg-muted/10 px-3 py-2">
            <AlertCircle className="h-3 w-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
            <p className="text-[9px] font-mono text-muted-foreground/60 leading-relaxed">
              No rows in 7d for: <span className="text-foreground/70">{missingCoverage.join(', ')}</span>.
              If you expect these to have run, double-check the corresponding edge function is
              calling <code className="text-muted-foreground/70">createAttemptLogger</code> around
              its AI fetch.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function MrrCard({ snapshot, loading }: { snapshot: MrrSnapshot | null; loading: boolean }) {
  if (loading && !snapshot) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
      </div>
    );
  }
  if (!snapshot) return null;

  const ratioPct = snapshot.ratio === null ? null : Math.round(snapshot.ratio * 100);
  const alert = ratioPct !== null && ratioPct >= 25;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            MRR
          </span>
        </div>
        <p className="text-[12px] font-mono text-foreground/80">${snapshot.mrrUsd.toFixed(0)}</p>
        <p className="text-[9px] font-mono text-muted-foreground/50">
          {snapshot.activeSubscribers} active
        </p>
      </div>
      <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            MTD AI cost
          </span>
        </div>
        <p className="text-[12px] font-mono text-foreground/80">
          ${snapshot.mtdCostUsd.toFixed(2)}
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/50">from generation_attempts</p>
      </div>
      <div
        className={`rounded-lg border px-3 py-2.5 ${
          alert ? 'border-destructive/30 bg-destructive/10' : 'border-border/20 bg-card/10'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          {alert ? (
            <AlertCircle className="h-3 w-3 text-destructive" />
          ) : (
            <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
          )}
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Cost / MRR
          </span>
        </div>
        <p
          className={`text-[12px] font-mono ${alert ? 'text-destructive' : 'text-foreground/80'}`}
        >
          {ratioPct === null ? 'n/a' : `${ratioPct}%`}
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/50">
          {ratioPct === null ? 'no MRR yet' : alert ? 'investigate' : 'healthy'}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: typeof DollarSign;
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground/40" />
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">
          {title}
        </span>
      </div>
      <p className="text-[12px] font-mono text-foreground/80">{value}</p>
      <p className="text-[9px] font-mono text-muted-foreground/50">{sub}</p>
    </div>
  );
}
