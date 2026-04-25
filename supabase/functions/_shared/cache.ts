/**
 * Shared companion cache read/write helpers.
 * Centralises the cache fallback chain logic used by all companion functions.
 */

import { COMPANION_SERVE_FRESHNESS_DAYS } from "./companion-serve-freshness.ts";

/** `companion_cache.companion_type` for zoom-out deep-time entries */
export const COMPANION_ZOOM_OUT_DEEP_TIME = "zoom_out_deep_time";

/** Which `serveFromCache` pass produced the row (telemetry + optional UI transparency). */
export type CacheServeRelaxation = "none" | "market" | "repeat_or_lower_quality";

/** When passed from generators, `cache_serve` / `cache_strict_miss` use request correlation (cid, fn, drain). */
export type CacheTelemetryLog = (msg: string, extra?: Record<string, unknown>) => void;

function logCacheServeTelemetry(
  companionType: string,
  relaxation: CacheServeRelaxation,
  structuredLog?: CacheTelemetryLog,
): void {
  try {
    if (structuredLog) {
      structuredLog("cache_serve", {
        holzen_event: "cache_serve",
        companion_type: companionType,
        cache_relaxation: relaxation,
      });
    } else {
      console.log(
        JSON.stringify({
          holzen_event: "cache_serve",
          companion_type: companionType,
          cache_relaxation: relaxation,
          ts: new Date().toISOString(),
        }),
      );
    }
  } catch {
    /* ignore */
  }
}

/**
 * Emitted when the Phase-2 main-flow cache call (strict) finds no fresh+quality row and
 * yields to live generation. Grep: `cache_strict_miss` or `"holzen_event":"cache_strict_miss"`.
 *
 * Diagnostic only — expected when the user has seen the current cache pool within the
 * freshness window. A burst of these means "live is getting its shot" and is healthy; a
 * total absence of them combined with many `cache_serve relaxation:"repeat_or_lower_quality"`
 * events means the strict-mode plumbing is not being exercised.
 */
function logCacheStrictMiss(companionType: string, structuredLog?: CacheTelemetryLog): void {
  try {
    if (structuredLog) {
      structuredLog("cache_strict_miss", {
        holzen_event: "cache_strict_miss",
        companion_type: companionType,
      });
    } else {
      console.log(
        JSON.stringify({
          holzen_event: "cache_strict_miss",
          companion_type: companionType,
          ts: new Date().toISOString(),
        }),
      );
    }
  } catch {
    /* ignore */
  }
}

/** Options for context-aware and per-user cache serving */
export interface ServeFromCacheOptions {
  /** User ID — if provided, excludes entries this user has already seen */
  userId?: string;
  /** Market direction — if provided, prefers entries matching this direction */
  marketDirection?: "up" | "down" | "neutral";
  /** Specific cache entry IDs to exclude */
  excludeIds?: string[];
  /**
   * When true, skip the pass-3 `repeat_or_lower_quality` relaxation and return `null`
   * instead of a stale/seen row.
   *
   * Intended for the Phase-2 **main flow** in each generator, so that an empty strict
   * pool falls through to Phase-3 live generation instead of being pre-empted by a
   * previously-seen cache row (the original bug that made live almost never run when
   * the per-user freshness window, `COMPANION_SERVE_FRESHNESS_DAYS`, covered the
   * whole cache).
   *
   * The `serveFallback` path (post-live failure) should leave this `false` — a degraded
   * cached row is still better than an empty slot once live has already been tried.
   */
  strict?: boolean;
  /**
   * Filter cache rows to a specific generator `PROMPT_VERSION` (e.g. `"v4"`). Rows with
   * a different or `NULL` `prompt_version` are excluded.
   *
   * Opt-in per generator: callers that don't pass this keep the pre-`prompt_version`
   * behaviour (no filter). Use when bumping a generator's PROMPT_VERSION so stale rows
   * written under an older prompt stop being served.
   *
   * See migration `20260418180000_companion_cache_prompt_version.sql`.
   */
  promptVersion?: string;
  /**
   * When set (companion generators pass the orchestrate request `log`), cache hit/miss
   * telemetry uses `createLogger` JSON shape — grep `cache_serve` / `cache_strict_miss`.
   */
  structuredLog?: CacheTelemetryLog;
}

/**
 * Serve from cache with quality-ranked selection, per-user dedup, and market context.
 *
 * Selection strategy:
 * 1. Per-user seen rows excluded when userId is set (via `user_companion_serves`,
 *    only serves within COMPANION_SERVE_FRESHNESS_DAYS — aligns with content_library).
 * 2. First pass: quality_score ≥ 2, optional market_regime filter → `relaxation: "none"`.
 * 3. Second pass (only if marketDirection set): quality ≥ 2, any regime → `"market"`.
 * 4. Third pass: any quality, seen rows allowed again → `"repeat_or_lower_quality"`.
 *    Skipped entirely when `options.strict` is true — see option docs.
 * 5. Returns null if all (enabled) passes fail.
 */
export async function serveFromCache(
  svcClient: any,
  companionType: string,
  language = "en",
  excludeIdsOrOptions?: string[] | ServeFromCacheOptions,
): Promise<{ data: any; cacheId: string; relaxation: CacheServeRelaxation } | null> {
  // Parse options (backward compatible with old string[] signature)
  let options: ServeFromCacheOptions;
  if (Array.isArray(excludeIdsOrOptions)) {
    options = { excludeIds: excludeIdsOrOptions };
  } else {
    options = excludeIdsOrOptions ?? {};
  }

  const { userId, marketDirection, excludeIds, strict, promptVersion, structuredLog } = options;
  const now = new Date().toISOString();

  // Step 1: Get per-user seen entries (if userId provided)
  let userSeenIds: Set<string> = new Set();
  if (userId) {
    try {
      const windowStart = new Date(
        Date.now() - COMPANION_SERVE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();
      const { data: seen } = await svcClient
        .from("user_companion_serves")
        .select("cache_entry_id")
        .eq("user_id", userId)
        .eq("companion_type", companionType)
        .gte("served_at", windowStart);
      if (seen) {
        userSeenIds = new Set(seen.map((r: any) => r.cache_entry_id));
      }
    } catch {
      // Table may not exist yet — continue without per-user filtering
    }
  }

  // Combine all exclusions
  const allExcludeIds = new Set([
    ...(excludeIds ?? []),
    ...userSeenIds,
  ]);

  // Step 2: First pass — high quality, optionally filtered by market direction
  const picked = await tryServe(svcClient, {
    companionType,
    language,
    minQuality: 2,
    marketDirection,
    excludeIds: allExcludeIds,
    limit: 24,
    now,
    randomPickCap: 12,
    promptVersion,
  });
  if (picked) {
    logCacheServeTelemetry(companionType, "none", structuredLog);
    recordUserServe(svcClient, userId, picked.cacheId, companionType);
    return { ...picked, relaxation: "none" };
  }

  // Step 3: Second pass — high quality, any direction (in case market filter was too restrictive)
  if (marketDirection) {
    const picked2 = await tryServe(svcClient, {
      companionType,
      language,
      minQuality: 2,
      excludeIds: allExcludeIds,
      limit: 24,
      now,
      randomPickCap: 12,
      promptVersion,
    });
    if (picked2) {
      logCacheServeTelemetry(companionType, "market", structuredLog);
      recordUserServe(svcClient, userId, picked2.cacheId, companionType);
      return { ...picked2, relaxation: "market" };
    }
  }

  // Step 4: Third pass — any quality, ignore user seen (better to repeat than show nothing).
  // Skipped in strict mode so the caller (Phase-2 main flow) can fall through to live
  // instead of being pre-empted by a seen/low-quality row.
  if (strict) {
    logCacheStrictMiss(companionType, structuredLog);
    return null;
  }
  const picked3 = await tryServe(svcClient, {
    companionType,
    language,
    minQuality: 0,
    excludeIds: new Set(excludeIds ?? []), // Only exclude explicit IDs, not user-seen
    limit: 40,
    now,
    randomPickCap: 15,
    promptVersion,
  });
  if (picked3) {
    logCacheServeTelemetry(companionType, "repeat_or_lower_quality", structuredLog);
    recordUserServe(svcClient, userId, picked3.cacheId, companionType);
    return { ...picked3, relaxation: "repeat_or_lower_quality" };
  }

  return null;
}

// ── Internal helpers ──

interface TryServeParams {
  companionType: string;
  language: string;
  minQuality: number;
  marketDirection?: "up" | "down" | "neutral";
  excludeIds: Set<string>;
  limit: number;
  now: string;
  /** Random pick among the first N rows of the filtered pool (default 3). */
  randomPickCap?: number;
  /** Restrict to rows matching this generator PROMPT_VERSION, if set. */
  promptVersion?: string;
}

async function tryServe(
  svcClient: any,
  params: TryServeParams,
): Promise<{ data: any; cacheId: string } | null> {
  try {
    let query = svcClient
      .from("companion_cache")
      .select("id, content, quality_score, used_count, market_regime, source_untrusted")
      .eq("companion_type", params.companionType)
      .eq("language", params.language)
      .gte("quality_score", params.minQuality)
      .or(`expires_at.is.null,expires_at.gt.${params.now}`)
      .order("quality_score", { ascending: false })
      .order("last_served_at", { ascending: true, nullsFirst: true })
      .order("used_count", { ascending: true })
      .limit(params.limit);

    // Prompt-version filter (opt-in): generators bump their PROMPT_VERSION when
    // the prompt/seed/quality rules materially change, and pass it here so rows
    // written under older prompts stop being served.
    if (params.promptVersion) {
      query = query.eq("prompt_version", params.promptVersion);
    }

    // Market direction filter
    if (params.marketDirection) {
      query = query.or(`market_regime.eq.${params.marketDirection},market_regime.is.null`);
    }

    const { data } = await query;
    if (!data || data.length === 0) return null;

    // Filter out excluded IDs client-side (more flexible than SQL NOT IN)
    const pool = params.excludeIds.size > 0
      ? data.filter((d: any) => !params.excludeIds.has(d.id))
      : data;

    if (pool.length === 0) return null;

    // Prefer rows not marked source_untrusted (admin can keep body but deprioritize attribution)
    const trusted = pool.filter((d: any) => !d.source_untrusted);
    const pickPool = trusted.length > 0 ? trusted : pool;

    const cap = params.randomPickCap ?? 3;
    const pick = pickPool[Math.floor(Math.random() * Math.min(pickPool.length, cap))];
    updateServeStats(svcClient, pick.id, pick.used_count, params.now);
    return { data: pick.content, cacheId: pick.id };
  } catch {
    return null;
  }
}

function logCacheSideEffect(op: string, err: unknown): void {
  console.error(JSON.stringify({
    fn: "cache",
    op,
    level: "error",
    msg: err instanceof Error ? err.message : String(err),
  }));
}

function updateServeStats(svcClient: any, id: string, currentCount: number, now: string) {
  svcClient
    .from("companion_cache")
    .update({ used_count: (currentCount || 0) + 1, last_served_at: now })
    .eq("id", id)
    .then(() => {})
    .catch((e: unknown) => logCacheSideEffect("updateServeStats", e));
}

function recordUserServe(svcClient: any, userId: string | undefined, cacheId: string, companionType: string) {
  if (!userId) return;
  // Fire-and-forget: record that this user saw this cache entry
  svcClient
    .from("user_companion_serves")
    .upsert(
      { user_id: userId, cache_entry_id: cacheId, companion_type: companionType, served_at: new Date().toISOString() },
      { onConflict: "user_id,cache_entry_id" },
    )
    .then(() => {})
    .catch((e: unknown) => logCacheSideEffect("recordUserServe", e));
}

/**
 * Parse market direction from a context string.
 * Returns 'up', 'down', or 'neutral'.
 */
export function parseMarketDirection(context?: string): "up" | "down" | "neutral" {
  if (!context) return "neutral";
  const lower = context.toLowerCase();
  if (lower.includes("is down") || lower.includes("dropped") || lower.includes("fell")) return "down";
  if (lower.includes("is up") || lower.includes("rose") || lower.includes("gained")) return "up";
  return "neutral";
}
