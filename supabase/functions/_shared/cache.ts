/**
 * Shared companion cache read/write helpers.
 * Centralises the cache fallback chain logic used by all companion functions.
 */

/** `companion_cache.companion_type` for zoom-out deep-time entries */
export const COMPANION_ZOOM_OUT_DEEP_TIME = "zoom_out_deep_time";

/** Options for context-aware and per-user cache serving */
export interface ServeFromCacheOptions {
  /** User ID — if provided, excludes entries this user has already seen */
  userId?: string;
  /** Market direction — if provided, prefers entries matching this direction */
  marketDirection?: "up" | "down" | "neutral";
  /** Specific cache entry IDs to exclude */
  excludeIds?: string[];
}

/**
 * Serve from cache with quality-ranked selection, per-user dedup, and market context.
 *
 * Selection strategy:
 * 1. If userId provided: get list of cache entries this user has seen, exclude them
 * 2. If marketDirection provided: prefer entries matching that direction
 * 3. First pass: quality_score ≥ 2, unexpired, least recently served
 * 4. Second pass: any quality, unexpired (ignoring market direction)
 * 5. Returns null if all passes fail
 */
export async function serveFromCache(
  svcClient: any,
  companionType: string,
  language = "en",
  excludeIdsOrOptions?: string[] | ServeFromCacheOptions,
): Promise<{ data: any; cacheId: string } | null> {
  // Parse options (backward compatible with old string[] signature)
  let options: ServeFromCacheOptions;
  if (Array.isArray(excludeIdsOrOptions)) {
    options = { excludeIds: excludeIdsOrOptions };
  } else {
    options = excludeIdsOrOptions ?? {};
  }

  const { userId, marketDirection, excludeIds } = options;
  const now = new Date().toISOString();

  // Step 1: Get per-user seen entries (if userId provided)
  let userSeenIds: Set<string> = new Set();
  if (userId) {
    try {
      const { data: seen } = await svcClient
        .from("user_companion_serves")
        .select("cache_entry_id")
        .eq("user_id", userId)
        .eq("companion_type", companionType);
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
    limit: 15,
    now,
  });
  if (picked) {
    recordUserServe(svcClient, userId, picked.cacheId, companionType);
    return picked;
  }

  // Step 3: Second pass — high quality, any direction (in case market filter was too restrictive)
  if (marketDirection) {
    const picked2 = await tryServe(svcClient, {
      companionType,
      language,
      minQuality: 2,
      excludeIds: allExcludeIds,
      limit: 10,
      now,
    });
    if (picked2) {
      recordUserServe(svcClient, userId, picked2.cacheId, companionType);
      return picked2;
    }
  }

  // Step 4: Third pass — any quality, ignore user seen (better to repeat than show nothing)
  const picked3 = await tryServe(svcClient, {
    companionType,
    language,
    minQuality: 0,
    excludeIds: new Set(excludeIds ?? []), // Only exclude explicit IDs, not user-seen
    limit: 5,
    now,
  });
  if (picked3) {
    recordUserServe(svcClient, userId, picked3.cacheId, companionType);
    return picked3;
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

    // Random pick from top 3
    const pick = pickPool[Math.floor(Math.random() * Math.min(pickPool.length, 3))];
    updateServeStats(svcClient, pick.id, pick.used_count, params.now);
    return { data: pick.content, cacheId: pick.id };
  } catch {
    return null;
  }
}

function updateServeStats(svcClient: any, id: string, currentCount: number, now: string) {
  svcClient
    .from("companion_cache")
    .update({ used_count: (currentCount || 0) + 1, last_served_at: now })
    .eq("id", id)
    .then(() => {});
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
    .then(() => {});
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
