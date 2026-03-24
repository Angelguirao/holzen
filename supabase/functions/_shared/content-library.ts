/**
 * Content Library — local-first content search with per-user freshness.
 *
 * The library is the primary content source. Perplexity is the fallback
 * for when the library has no FRESH content for this user.
 *
 * Freshness: A library entry is "fresh" for a user if they haven't
 * seen it in the last 7 days. After 7 days, it becomes fresh again.
 */

const FRESHNESS_WINDOW_DAYS = 7;

export interface LibraryEntry {
  id: string;
  type: string;
  title: string;
  author: string | null;
  summary: string;
  url: string | null;
  key_quote: string | null;
  citation: string | null;
  finding: string | null;
  event_date: string | null;
  asset_class: string | null;
  analogy: string | null;
  recovery: string | null;
  mood_tag: string | null;
  tags: string[];
  quality_score: number;
}

export interface LibrarySearchOptions {
  /** Content type to search: 'essay', 'paper', 'event' */
  type: string;
  /** User ID — for freshness tracking (exclude recently seen) */
  userId?: string;
  /** Companion type(s) the result should be usable by */
  companionType?: string;
  /** Tags to prefer (partial match) */
  preferTags?: string[];
  /** Mood tag to filter by (for events) */
  moodTag?: string;
  /** Titles to exclude (recently shown — from localStorage dedup) */
  excludeTitles?: string[];
  /** Maximum results */
  limit?: number;
  /** If true, include entries the user has seen recently (stale mode for fallback) */
  includeStale?: boolean;
}

/**
 * Search the local content library for FRESH entries this user hasn't seen recently.
 *
 * Returns entries sorted by quality and relevance, or empty array if:
 * - No matching entries exist
 * - All matching entries were seen by this user in the last 7 days
 *   (unless includeStale=true)
 *
 * The library table may not exist yet (before migration) — returns empty gracefully.
 */
export async function searchLibrary(
  svcClient: any,
  options: LibrarySearchOptions,
): Promise<LibraryEntry[]> {
  try {
    let query = svcClient
      .from("content_library")
      .select("id, type, title, author, summary, url, key_quote, citation, finding, event_date, asset_class, analogy, recovery, mood_tag, tags, quality_score")
      .eq("type", options.type)
      .eq("active", true)
      .order("quality_score", { ascending: false })
      .limit(options.limit ?? 20);

    if (options.companionType) {
      query = query.contains("companion_types", [options.companionType]);
    }

    if (options.moodTag) {
      query = query.eq("mood_tag", options.moodTag);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return [];

    let entries = data as LibraryEntry[];

    // Exclude by title (from localStorage dedup hints)
    if (options.excludeTitles?.length) {
      const excludeSet = new Set(options.excludeTitles.map(t => t.toLowerCase()));
      entries = entries.filter(e => !excludeSet.has(e.title.toLowerCase()));
    }

    // ── Per-user freshness: exclude entries seen in the last 7 days ──
    if (options.userId && !options.includeStale) {
      const recentlySeen = await getRecentlySeenLibraryIds(svcClient, options.userId, options.companionType);
      if (recentlySeen.size > 0) {
        const freshEntries = entries.filter(e => !recentlySeen.has(e.id));
        if (freshEntries.length > 0) {
          entries = freshEntries;
        } else {
          // All entries seen recently — return empty to force Perplexity
          return [];
        }
      }
    }

    // Boost entries matching preferred tags
    if (options.preferTags?.length) {
      const tagSet = new Set(options.preferTags.map(t => t.toLowerCase()));
      entries.sort((a, b) => {
        const aMatches = a.tags.filter(t => tagSet.has(t)).length;
        const bMatches = b.tags.filter(t => tagSet.has(t)).length;
        return bMatches - aMatches;
      });
    }

    return entries;
  } catch {
    return [];
  }
}

/**
 * Record that a user was served a library entry.
 * Uses the same user_companion_serves table as cache tracking.
 */
export function recordLibraryServe(
  svcClient: any,
  userId: string | undefined,
  libraryEntryId: string,
  companionType: string,
) {
  if (!userId) return;
  // Use library entry ID in the cache_entry_id column (repurposed for both cache and library)
  svcClient
    .from("user_companion_serves")
    .upsert(
      {
        user_id: userId,
        cache_entry_id: libraryEntryId,
        companion_type: companionType,
        served_at: new Date().toISOString(),
      },
      { onConflict: "user_id,cache_entry_id" },
    )
    .then(() => {});
}

// ── Internal helpers ──

/**
 * Get IDs of library/cache entries this user has seen in the freshness window.
 */
async function getRecentlySeenLibraryIds(
  svcClient: any,
  userId: string,
  companionType?: string,
): Promise<Set<string>> {
  try {
    const windowStart = new Date(Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

    let query = svcClient
      .from("user_companion_serves")
      .select("cache_entry_id")
      .eq("user_id", userId)
      .gte("served_at", windowStart);

    if (companionType) {
      query = query.eq("companion_type", companionType);
    }

    const { data } = await query;
    if (!data) return new Set();
    return new Set(data.map((r: any) => r.cache_entry_id));
  } catch {
    return new Set(); // Table may not exist yet
  }
}

// ── Format converters ──

export function essayToSignal(entry: LibraryEntry): { title: string; body: string; source: string; url: string; quote?: string } {
  return {
    title: entry.title,
    body: entry.summary,
    source: entry.author || "Unknown",
    url: entry.url || "",
    ...(entry.key_quote ? { quote: entry.key_quote } : {}),
  };
}

export function paperToGrounding(entry: LibraryEntry): { title: string; body: string; citation: string; url: string } {
  return {
    title: entry.title,
    body: entry.finding || entry.summary,
    citation: entry.citation || `${entry.author}, ${entry.title}`,
    url: entry.url || "",
  };
}

export function eventToHistory(entry: LibraryEntry): { title: string; btcInsight: string; analogy: string; assetClass: string; period: string; recovery?: string; source?: string; url?: string } {
  return {
    title: entry.title,
    btcInsight: entry.summary,
    analogy: entry.analogy || "",
    assetClass: entry.asset_class || "",
    period: entry.event_date || "",
    recovery: entry.recovery || undefined,
    source: entry.author || undefined,
    url: entry.url || undefined,
  };
}
