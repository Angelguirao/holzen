/**
 * Content Library — local-first content search for companion generators.
 *
 * Generators call searchLibrary() BEFORE calling Perplexity.
 * If a good match is found locally, Perplexity is skipped entirely.
 * This reduces API dependency, cost, and latency.
 */

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
  /** Companion type(s) the result should be usable by */
  companionType?: string;
  /** Tags to prefer (partial match) */
  preferTags?: string[];
  /** Mood tag to filter by (for events) */
  moodTag?: string;
  /** Titles to exclude (recently shown) */
  excludeTitles?: string[];
  /** Maximum results */
  limit?: number;
}

/**
 * Search the local content library for matching entries.
 * Returns entries sorted by quality and relevance, or empty array if none found.
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
      .limit(options.limit ?? 10);

    // Filter by companion type if specified
    if (options.companionType) {
      query = query.contains("companion_types", [options.companionType]);
    }

    // Filter by mood tag for events
    if (options.moodTag) {
      query = query.eq("mood_tag", options.moodTag);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) return [];

    let entries = data as LibraryEntry[];

    // Exclude recently shown titles
    if (options.excludeTitles?.length) {
      const excludeSet = new Set(options.excludeTitles.map(t => t.toLowerCase()));
      entries = entries.filter(e => !excludeSet.has(e.title.toLowerCase()));
    }

    // Boost entries matching preferred tags
    if (options.preferTags?.length) {
      const tagSet = new Set(options.preferTags.map(t => t.toLowerCase()));
      entries.sort((a, b) => {
        const aMatches = a.tags.filter(t => tagSet.has(t)).length;
        const bMatches = b.tags.filter(t => tagSet.has(t)).length;
        return bMatches - aMatches; // More matching tags = higher priority
      });
    }

    return entries;
  } catch {
    // Table may not exist yet — return empty gracefully
    return [];
  }
}

/**
 * Convert a library essay entry to Signal companion format.
 */
export function essayToSignal(entry: LibraryEntry): { title: string; body: string; source: string; url: string; quote?: string } {
  return {
    title: entry.title,
    body: entry.summary,
    source: entry.author || "Unknown",
    url: entry.url || "",
    ...(entry.key_quote ? { quote: entry.key_quote } : {}),
  };
}

/**
 * Convert a library paper entry to Grounding companion format.
 */
export function paperToGrounding(entry: LibraryEntry): { title: string; body: string; citation: string; url: string } {
  return {
    title: entry.title,
    body: entry.finding || entry.summary,
    citation: entry.citation || `${entry.author}, ${entry.title}`,
    url: entry.url || "",
  };
}

/**
 * Convert a library event entry to History companion format.
 */
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
