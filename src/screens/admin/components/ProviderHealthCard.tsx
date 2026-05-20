/**
 * Admin widget: current circuit-breaker state per provider.
 *
 * Read-only. Computes the same error-rate / sample math as the edge-side
 * `getProviderHealth()` so admin's view matches what the orchestrator saw
 * on its last request. Auto-refreshes every 30 s via TanStack Query refetchInterval.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  type Provider,
  type ProviderStat,
  PROVIDER_HEALTH_ERROR_RATE_THRESHOLD,
  PROVIDER_HEALTH_MIN_SAMPLE,
  PROVIDER_HEALTH_WINDOW_MINUTES,
  getProviderHealthQueryOptions,
} from '@/features/pause/public-queries';

export function ProviderHealthCard() {
  const { data: stats, isPending: loading } = useQuery(getProviderHealthQueryOptions());

  const providers: Provider[] = useMemo(() => ['perplexity', 'lovable'], []);

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
        Provider health{' '}
        <span className="text-muted-foreground/40 normal-case">
          (last {PROVIDER_HEALTH_WINDOW_MINUTES}m)
        </span>
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
        Live circuit-breaker state. Degraded = error rate ≥{' '}
        {Math.round(PROVIDER_HEALTH_ERROR_RATE_THRESHOLD * 100)}%
        over ≥ {PROVIDER_HEALTH_MIN_SAMPLE} calls. When degraded, live generation is skipped for
        affected features; cache + library + curated fallback still serve. Recovery
        is automatic as new calls succeed.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/50">loading…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {providers.map((p) => (
            <ProviderTile key={p} name={p} stat={stats?.[p]} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProviderTile({ name, stat }: { name: Provider; stat: ProviderStat | undefined }) {
  if (!stat) return null;
  const isDegraded = stat.state === 'degraded';
  const isInsufficient = stat.state === 'insufficient_sample';
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        isDegraded
          ? 'border-destructive/40 bg-destructive/10'
          : 'border-border/20 bg-card/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/80">
          {name}
        </span>
        {isDegraded ? (
          <span className="flex items-center gap-1 text-[9px] font-mono text-destructive">
            <AlertTriangle className="h-2.5 w-2.5" /> DEGRADED
          </span>
        ) : isInsufficient ? (
          <span className="text-[9px] font-mono text-muted-foreground/45">no signal</span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
            <CheckCircle2 className="h-2.5 w-2.5" /> ok
          </span>
        )}
      </div>
      <p className="text-[11px] font-mono text-foreground/70">
        {(stat.errorRate * 100).toFixed(0)}%
        <span className="text-muted-foreground/50 text-[9px] ml-1">err rate</span>
      </p>
      <div className="flex gap-3 mt-1">
        <span className="text-[9px] text-muted-foreground/50">✓ {stat.successes}</span>
        <span className="text-[9px] text-muted-foreground/50">✗ {stat.errors}</span>
        <span className="text-[9px] text-muted-foreground/50">n={stat.sample}</span>
      </div>
    </div>
  );
}
