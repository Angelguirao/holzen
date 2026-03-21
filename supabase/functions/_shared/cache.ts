/**
 * Shared companion cache read/write helpers.
 * Centralises the cache fallback chain logic used by all companion functions.
 */

/** `companion_cache.companion_type` for zoom-out deep-time entries */
export const COMPANION_ZOOM_OUT_DEEP_TIME = "zoom_out_deep_time";

/**
 * Serve from cache with quality-ranked selection.
 * Returns the best available cached content, or null if cache is empty.
 *
 * Selection strategy:
 * 1. First pass: quality_score ≥ 2, unexpired, least recently served
 * 2. Second pass: any quality, unexpired
 * 3. Returns null if both passes fail
 */
export async function serveFromCache(
  svcClient: any,
  companionType: string,
  language = "en",
  excludeIds?: string[],
): Promise<{ data: any; cacheId: string } | null> {
  const now = new Date().toISOString();

  // First pass: high quality
  try {
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, quality_score, used_count")
      .eq("companion_type", companionType)
      .eq("language", language)
      .gte("quality_score", 2)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("quality_score", { ascending: false })
      .order("last_served_at", { ascending: true, nullsFirst: true })
      .order("used_count", { ascending: true })
      .limit(10);

    const pool = filterPool(data, excludeIds);
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
      updateServeStats(svcClient, pick.id, pick.used_count, now);
      return { data: pick.content, cacheId: pick.id };
    }
  } catch { /* continue to second pass */ }

  // Second pass: any quality
  try {
    const { data } = await svcClient
      .from("companion_cache")
      .select("id, content, used_count")
      .eq("companion_type", companionType)
      .eq("language", language)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("quality_score", { ascending: false })
      .order("used_count", { ascending: true })
      .limit(5);

    const pool = filterPool(data, excludeIds);
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 3))];
      updateServeStats(svcClient, pick.id, pick.used_count, now);
      return { data: pick.content, cacheId: pick.id };
    }
  } catch { /* continue */ }

  return null;
}

function filterPool(data: any[] | null, excludeIds?: string[]): any[] {
  if (!data || data.length === 0) return [];
  if (!excludeIds?.length) return data;
  const filtered = data.filter((d: any) => !excludeIds.includes(d.id));
  return filtered.length > 0 ? filtered : data;
}

function updateServeStats(svcClient: any, id: string, currentCount: number, now: string) {
  // Fire-and-forget: updating serve stats is non-critical
  svcClient
    .from("companion_cache")
    .update({ used_count: (currentCount || 0) + 1, last_served_at: now })
    .eq("id", id)
    .then(() => {});
}
