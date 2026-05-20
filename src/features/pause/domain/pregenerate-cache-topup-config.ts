/**
 * Need-based top-up thresholds for `pregenerate-companions` (`app_config.pregenerate_cache_topup`).
 * Client canonical copy — keep in sync with `supabase/functions/_shared/pregenerate-cache-topup-config.ts`.
 */

export type PregenerateCacheTopupKey =
  | 'ground_nudge'
  | 'signal'
  | 'historical_insight'
  | 'zoom_out_deep_time';

export interface PregenerateCacheTopupTypeConfig {
  /** Count `companion_cache` rows with quality_score ≥ 2 and not expired — target floor. */
  minHealthyRows: number;
  /** Max new rows to attempt per cron run for this type (caps API spend per invocation). */
  maxGeneratePerRun: number;
}

export type PregenerateCacheTopupConfig = Record<PregenerateCacheTopupKey, PregenerateCacheTopupTypeConfig>;

export const PREGENERATE_CACHE_TOPUP_KEYS: readonly PregenerateCacheTopupKey[] = [
  'ground_nudge',
  'signal',
  'historical_insight',
  'zoom_out_deep_time',
] as const;

export const DEFAULT_PREGENERATE_CACHE_TOPUP: PregenerateCacheTopupConfig = {
  ground_nudge: { minHealthyRows: 18, maxGeneratePerRun: 2 },
  signal: { minHealthyRows: 12, maxGeneratePerRun: 1 },
  historical_insight: { minHealthyRows: 12, maxGeneratePerRun: 1 },
  zoom_out_deep_time: { minHealthyRows: 10, maxGeneratePerRun: 1 },
};

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/** Merge DB JSON with defaults; invalid/missing fields keep defaults. */
export function mergePregenerateCacheTopup(raw: unknown): PregenerateCacheTopupConfig {
  const base: PregenerateCacheTopupConfig = {
    ground_nudge: { ...DEFAULT_PREGENERATE_CACHE_TOPUP.ground_nudge },
    signal: { ...DEFAULT_PREGENERATE_CACHE_TOPUP.signal },
    historical_insight: { ...DEFAULT_PREGENERATE_CACHE_TOPUP.historical_insight },
    zoom_out_deep_time: { ...DEFAULT_PREGENERATE_CACHE_TOPUP.zoom_out_deep_time },
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  for (const k of PREGENERATE_CACHE_TOPUP_KEYS) {
    const block = o[k];
    if (block && typeof block === 'object' && !Array.isArray(block)) {
      const b = block as Record<string, unknown>;
      if (b.minHealthyRows !== undefined) {
        const n = Number(b.minHealthyRows);
        if (Number.isFinite(n)) base[k].minHealthyRows = clampInt(n, 0, 500);
      }
      if (b.maxGeneratePerRun !== undefined) {
        const n = Number(b.maxGeneratePerRun);
        if (Number.isFinite(n)) base[k].maxGeneratePerRun = clampInt(n, 0, 20);
      }
    }
  }
  return base;
}
