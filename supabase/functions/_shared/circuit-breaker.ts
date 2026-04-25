import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * Per-provider circuit breakers for AI spend protection.
 *
 * Reads recent rows from `generation_attempts` to compute an error rate per
 * provider over a rolling window. When error rate ≥ threshold AND the sample
 * size is large enough to be meaningful, the breaker is marked "degraded"
 * and callers should skip **live** generation for that provider.
 *
 * Important scope:
 *   - Breakers only affect **live** generation. Cached serves
 *     (`pause_ai_artifacts`, `companion_cache`, `content_library`) are
 *     unaffected. Cache + library + curated fallback continue to serve.
 *   - Recovery is automatic. Every time `getProviderHealth` is called (after
 *     the per-instance TTL expires) it re-computes from the latest window;
 *     when the rate drops, the breaker clears.
 *
 * The cache is per-Edge-instance (30 s TTL). Drift across the fleet is fine
 * — worst case, one instance trips a few seconds before another. Logging
 * and the admin UI read from the same underlying table so they stay
 * coherent regardless of which instance renders them.
 */

export type Provider = "perplexity" | "lovable";

export interface ProviderState {
  state: "ok" | "degraded";
  errorRate: number;
  sample: number;
  successes: number;
  errors: number;
  windowMinutes: number;
}

export type ProviderHealth = Record<Provider, ProviderState>;

interface BreakerOptions {
  /** Rolling window in minutes. Default 10. */
  windowMinutes?: number;
  /** Error-rate threshold at which we mark degraded (0..1). Default 0.3. */
  errorRateThreshold?: number;
  /** Minimum attempts in the window before we trust the error rate. Default 10. */
  minSample?: number;
}

const DEFAULTS: Required<BreakerOptions> = {
  windowMinutes: 10,
  errorRateThreshold: 0.3,
  minSample: 10,
};

let cache: { at: number; health: ProviderHealth } | null = null;
const TTL_MS = 30_000;

function emptyHealth(windowMinutes: number): ProviderHealth {
  const s: ProviderState = {
    state: "ok",
    errorRate: 0,
    sample: 0,
    successes: 0,
    errors: 0,
    windowMinutes,
  };
  return { perplexity: { ...s }, lovable: { ...s } };
}

/**
 * Status values in `generation_attempts` that count as "error" for the
 * breaker. `quality_gate_failed` is NOT counted — that's a content issue,
 * not a provider-health issue, and we don't want a prompt regression to
 * falsely trip the breaker.
 */
const ERROR_STATUSES: ReadonlySet<string> = new Set([
  "error",
  "timeout",
  "rate_limited",
]);

export async function getProviderHealth(
  svcClient: SupabaseClient,
  options?: BreakerOptions & { force?: boolean },
): Promise<ProviderHealth> {
  const opts = { ...DEFAULTS, ...options };
  const now = Date.now();

  if (!options?.force && cache && now - cache.at < TTL_MS) {
    return cache.health;
  }

  try {
    const since = new Date(now - opts.windowMinutes * 60_000).toISOString();
    const { data, error } = await svcClient
      .from("generation_attempts")
      .select("provider, status")
      .gte("created_at", since)
      .limit(10_000);

    if (error || !data) {
      const health = cache?.health ?? emptyHealth(opts.windowMinutes);
      return health;
    }

    const rows = data as Array<{ provider: string | null; status: string | null }>;
    const agg: Record<Provider, { successes: number; errors: number }> = {
      perplexity: { successes: 0, errors: 0 },
      lovable: { successes: 0, errors: 0 },
    };

    for (const row of rows) {
      const p = normalizeProvider(row.provider);
      if (!p) continue;
      if (row.status === "success") agg[p].successes += 1;
      else if (row.status && ERROR_STATUSES.has(row.status)) agg[p].errors += 1;
    }

    const health: ProviderHealth = {
      perplexity: buildState(agg.perplexity, opts),
      lovable: buildState(agg.lovable, opts),
    };

    cache = { at: now, health };
    return health;
  } catch (_e) {
    return cache?.health ?? emptyHealth(opts.windowMinutes);
  }
}

function normalizeProvider(raw: string | null | undefined): Provider | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "perplexity") return "perplexity";
  // "lovable", "lovable-ai", "google" (some older rows) all roll up to lovable.
  if (lower === "lovable" || lower === "lovable-ai" || lower === "google") return "lovable";
  return null;
}

function buildState(
  agg: { successes: number; errors: number },
  opts: Required<BreakerOptions>,
): ProviderState {
  const sample = agg.successes + agg.errors;
  const errorRate = sample === 0 ? 0 : agg.errors / sample;
  const degraded = sample >= opts.minSample && errorRate >= opts.errorRateThreshold;
  return {
    state: degraded ? "degraded" : "ok",
    errorRate,
    sample,
    successes: agg.successes,
    errors: agg.errors,
    windowMinutes: opts.windowMinutes,
  };
}

/**
 * Convenience: returns the subset of providers that are currently degraded.
 * Useful at guard-call sites that only care about a boolean gate.
 */
export async function degradedProviders(
  svcClient: SupabaseClient,
  providers: Provider[],
  options?: BreakerOptions,
): Promise<Provider[]> {
  const health = await getProviderHealth(svcClient, options);
  return providers.filter((p) => health[p].state === "degraded");
}

/** For tests only. */
export function _resetCircuitBreakerCache() {
  cache = null;
}

/** Exported for tests. */
export function _buildStateForTest(
  agg: { successes: number; errors: number },
  options?: BreakerOptions,
): ProviderState {
  return buildState(agg, { ...DEFAULTS, ...options });
}
