import { supabase } from '@/integrations/supabase/client';

export type Provider = 'perplexity' | 'lovable';

export interface ProviderStat {
  state: 'ok' | 'degraded' | 'insufficient_sample';
  errorRate: number;
  sample: number;
  successes: number;
  errors: number;
}

/** Matches circuit-breaker math documented on the admin card. */
export const PROVIDER_HEALTH_WINDOW_MINUTES = 10;
export const PROVIDER_HEALTH_ERROR_RATE_THRESHOLD = 0.3;
export const PROVIDER_HEALTH_MIN_SAMPLE = 10;

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
  const minSample = PROVIDER_HEALTH_MIN_SAMPLE;
  const threshold = PROVIDER_HEALTH_ERROR_RATE_THRESHOLD;
  for (const p of ['perplexity', 'lovable'] as Provider[]) {
    const sample = agg[p].successes + agg[p].errors;
    const errorRate = sample === 0 ? 0 : agg[p].errors / sample;
    let state: ProviderStat['state'] = 'ok';
    if (sample < minSample) state = 'insufficient_sample';
    else if (errorRate >= threshold) state = 'degraded';
    out[p] = { state, errorRate, sample, successes: agg[p].successes, errors: agg[p].errors };
  }
  return out;
}

export const ADMIN_PROVIDER_HEALTH_QUERY_KEY = [
  'admin',
  'provider-health',
  PROVIDER_HEALTH_WINDOW_MINUTES,
] as const;

export async function fetchProviderHealthStats(): Promise<Record<Provider, ProviderStat>> {
  const since = new Date(
    Date.now() - PROVIDER_HEALTH_WINDOW_MINUTES * 60_000,
  ).toISOString();
  const { data, error } = await supabase
    .from('generation_attempts')
    .select('provider, status')
    .gte('created_at', since)
    .limit(10_000);
  if (error || !data) return summarize([]);
  return summarize(data as AttemptRow[]);
}

export function getProviderHealthQueryOptions() {
  return {
    queryKey: ADMIN_PROVIDER_HEALTH_QUERY_KEY,
    queryFn: fetchProviderHealthStats,
    refetchInterval: 30_000,
    staleTime: 0,
    refetchOnWindowFocus: false,
  } as const;
}
