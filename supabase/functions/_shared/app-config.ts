import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  type PregenerateCacheTopupConfig,
  mergePregenerateCacheTopup,
} from "./pregenerate-cache-topup-config.ts";

export type { PregenerateCacheTopupConfig, PregenerateCacheTopupKey, PregenerateCacheTopupTypeConfig } from "./pregenerate-cache-topup-config.ts";
export { DEFAULT_PREGENERATE_CACHE_TOPUP, mergePregenerateCacheTopup } from "./pregenerate-cache-topup-config.ts";

/**
 * Runtime config loader for AI cost guardrails + feature flags + signup gate.
 *
 * - Reads the `app_config` table via service client (RLS bypassed).
 * - Caches per Edge instance for `TTL_MS` (30 s) to keep per-request overhead low.
 * - **Fails open**: a transient DB hiccup returns last-known or defaults rather
 *   than breaking features. The cost-ceiling checks themselves already log a
 *   `limit_check_fail_open` breadcrumb for alerting.
 *
 * Related: `supabase/migrations/20260419120000_app_config.sql`,
 * `supabase/functions/_shared/ratelimit.ts` (cost ceilings).
 */

/** Feature keys known to `feature_flags`. Extend here when adding a new AI feature. */
export type FeatureFlagKey =
  | "wallpaper"
  | "letters"
  | "nudges"
  | "digest"
  | "reports"
  | "night_reflection"
  | "reflection_insights"
  | "suggest_ritual"
  | "suggest_grounding"
  | "journal_prompt"
  | "pregenerate"
  | "fetch_source_feeds"
  | "grounding_enrich"
  | "admin_library_preview";

/**
 * Companion generator feature keys that are short-circuited when `panic_mode` is on.
 * Reflection (`reflection`) is intentionally NOT in this set — a $0.001 reflection
 * call is cheaper than the UX cost of a silent fallback.
 */
export const PANIC_MODE_FEATURES: ReadonlySet<string> = new Set([
  "companion_signal",
  "companion_grounding",
  "companion_history",
  "companion_zoom_out",
  "companion_intervention",
  "pregenerate",
]);

export interface AppConfig {
  signups_enabled: boolean;
  signups_max_per_day: number | null;
  budget_daily_usd_global: number;
  budget_daily_usd_per_user: number;
  budget_monthly_usd_global: number;
  panic_mode: boolean;
  feature_flags: Record<string, boolean>;
  /** Pregenerate-companions need-based top-up; see `app_config.pregenerate_cache_topup`. */
  pregenerate_cache_topup: PregenerateCacheTopupConfig;
}

const DEFAULTS: AppConfig = {
  signups_enabled: true,
  signups_max_per_day: null,
  budget_daily_usd_global: 60.0,
  budget_daily_usd_per_user: 2.5,
  budget_monthly_usd_global: 1800.0,
  panic_mode: false,
  feature_flags: {},
  pregenerate_cache_topup: mergePregenerateCacheTopup(null),
};

let cache: { loadedAt: number; config: AppConfig } | null = null;
const TTL_MS = 30_000;

function coerceNumber(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function coerceBoolean(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return fallback;
}

export async function loadAppConfig(
  svcClient: SupabaseClient,
  options?: { force?: boolean },
): Promise<AppConfig> {
  const now = Date.now();
  if (!options?.force && cache && now - cache.loadedAt < TTL_MS) {
    return cache.config;
  }

  try {
    const { data, error } = await svcClient.from("app_config").select("key, value");
    if (error || !data) {
      if (cache) return cache.config;
      return { ...DEFAULTS };
    }

    const merged: AppConfig = { ...DEFAULTS, feature_flags: { ...DEFAULTS.feature_flags } };
    for (const row of data as Array<{ key: string; value: unknown }>) {
      switch (row.key) {
        case "signups_enabled":
          merged.signups_enabled = coerceBoolean(row.value, DEFAULTS.signups_enabled);
          break;
        case "signups_max_per_day":
          merged.signups_max_per_day = row.value === null ? null : coerceNumber(row.value, 0);
          if (merged.signups_max_per_day !== null && merged.signups_max_per_day <= 0) {
            merged.signups_max_per_day = null;
          }
          break;
        case "budget_daily_usd_global":
          merged.budget_daily_usd_global = coerceNumber(row.value, DEFAULTS.budget_daily_usd_global);
          break;
        case "budget_daily_usd_per_user":
          merged.budget_daily_usd_per_user = coerceNumber(
            row.value,
            DEFAULTS.budget_daily_usd_per_user,
          );
          break;
        case "budget_monthly_usd_global":
          merged.budget_monthly_usd_global = coerceNumber(
            row.value,
            DEFAULTS.budget_monthly_usd_global,
          );
          break;
        case "panic_mode":
          merged.panic_mode = coerceBoolean(row.value, DEFAULTS.panic_mode);
          break;
        case "feature_flags":
          if (row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
            merged.feature_flags = row.value as Record<string, boolean>;
          }
          break;
        case "pregenerate_cache_topup":
          merged.pregenerate_cache_topup = mergePregenerateCacheTopup(row.value);
          break;
      }
    }

    cache = { loadedAt: now, config: merged };
    return merged;
  } catch (_e) {
    if (cache) return cache.config;
    return { ...DEFAULTS };
  }
}

/**
 * Feature gate. Returns `false` if:
 *  - `panic_mode` is on and `feature` is a panic-affected companion/pregenerate key, OR
 *  - `feature_flags[feature]` is explicitly set to `false`.
 *
 * Unknown features default to enabled — we don't want a typo in a function
 * name to silently break an unrelated AI path.
 */
export function isFeatureEnabled(config: AppConfig, feature: string): boolean {
  if (config.panic_mode && PANIC_MODE_FEATURES.has(feature)) return false;
  const flag = config.feature_flags[feature];
  return flag !== false;
}

/** For tests only. */
export function _resetAppConfigCache(): void {
  cache = null;
}
