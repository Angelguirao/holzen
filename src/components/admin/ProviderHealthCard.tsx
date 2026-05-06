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
import { supabase } from '@/integrations/supabase/client';

type Provider = 'perplexity' | 'lovable';

interface ProviderStat {
  state: 'ok' | 'degraded' | 'insufficient_sample';
  errorRate: number;
  sample: number;
  successes: number;
  errors: number;
}

const WINDOW_MINUTES = 10;
const ERROR_RATE_THRESHOLD = 0.3;
const MIN_SAMPLE = 10;

interface AttemptRow {
  provider: string | null;
  status: string | null;
}

const ERROR_STATUSES = new Set(['error', 'timeout', 'rate_limited']);

function normalize(raw: string | null): Provider | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'perplexity') return 'perplexity';
  if (lower === 'lovable' || lower === 'lovable-ai' || lower === 'google') return 'lovable';
  return null;
}

function summarize(rows: AttemptRow[]): Record<Provider, ProviderStat> {
  const agg: Record<Provider, { successes: number; errors: number }> = {
    perplexity: { successes: 0, errors: 0 },
    lovable: { successes: 0, errors: 0 },
  };
  for (const r of rows) {
    const p = normalize(r.provider);
    if (!p) continue;
    if (r.status === 'success') agg[p].successes += 1;
    else if (r.status && ERROR_STATUSES.has(r.status)) agg[p].errors += 1;
  }
  const out = {} as Record<Provider, ProviderStat>;
  for (const p of ['perplexity', 'lovable'] as Provider[]) {
    const sample = agg[p].successes + agg[p].errors;
    const errorRate = sample === 0 ? 0 : agg[p].errors / sample;
    let state: ProviderStat['state'] = 'ok';
    if (sample < MIN_SAMPLE) state = 'insufficient_sample';
    else if (errorRate >= ERROR_RATE_THRESHOLD) state = 'degraded';
    out[p] = { state, errorRate, sample, successes: agg[p].successes, errors: agg[p].errors };
  }
  return out;
}

const ADMIN_PROVIDER_HEALTH_QUERY_KEY = ['admin', 'provider-health', WINDOW_MINUTES] as const;

async function fetchProviderHealthStats(): Promise<Record<Provider, ProviderStat>> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase
    .from('generation_attempts')
    .select('provider, status')
    .gte('created_at', since)
    .limit(10_000);
  if (error || !data) return summarize([]);
  return summarize(data as AttemptRow[]);
}

export function ProviderHealthCard() {
  const { data: stats, isPending: loading } = useQuery({
    queryKey: ADMIN_PROVIDER_HEALTH_QUERY_KEY,
    queryFn: fetchProviderHealthStats,
    refetchInterval: 30_000,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const providers: Provider[] = useMemo(() => ['perplexity', 'lovable'], []);

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
        Provider health <span className="text-muted-foreground/40 normal-case">(last {WINDOW_MINUTES}m)</span>
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
        Live circuit-breaker state. Degraded = error rate ≥ {Math.round(ERROR_RATE_THRESHOLD * 100)}%
        over ≥ {MIN_SAMPLE} calls. When degraded, live generation is skipped for
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
