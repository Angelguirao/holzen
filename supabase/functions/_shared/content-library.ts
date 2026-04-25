/**
 * Content Library — curated rows in `content_library` with per-user freshness.
 *
 * Companion generators (Signal, Grounding, History) try this library **first**,
 * then `companion_cache`, then live AI (Perplexity, etc.), then static curated
 * fallbacks. Phase ordering is controlled by `_shared/phase-config.ts`.
 *
 * When `includeStale` is false, entries the user was served within the
 * `COMPANION_SERVE_FRESHNESS_DAYS` rolling window are skipped so repeats are
 * less likely. Use `includeStale: true` only if you need any library row
 * regardless of recency.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { COMPANION_SERVE_FRESHNESS_DAYS } from "./companion-serve-freshness.ts";

export interface LibraryEntry {
  id: string;
  type: string;
  title: string;
  author: string | null;
  summary: string;
  url: string | null;
  /** First-publication URL when `url` is a mirror (e.g. Substack original). */
  original_url: string | null;
  original_publication: string | null;
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

/** Stable reasons the library phase returned [] and the generator fell through.
 *  Matches `logQualityGateStructuredReject` shape: `holzen_event` + `reason` stable code. */
type LibrarySearchRejectReason = "db_error" | "empty" | "all_seen" | "threw";

/**
 * Structured Edge log when the content_library phase returns nothing and the generator
 * falls through to `companion_cache` / curated.
 *
 * Grep: `library_search_rejected` or `"holzen_event":"library_search_rejected"`.
 * Pair with `companion_slot_resolved` (same reflection) to see which slot fell through.
 * Aggregate by `reason` to spot RLS regressions (`db_error`), empty pools (`empty`),
 * freshness exhaustion (`all_seen`), or unexpected throws (`threw`).
 */
function logLibrarySearchRejected(
  reason: LibrarySearchRejectReason,
  fields: {
    type: string;
    companion_type: string | null;
    mood_tag: string | null;
    candidate_pool_size?: number;
    recently_seen_size?: number;
    detail?: string;
  },
): void {
  try {
    console.warn(JSON.stringify({
      holzen_event: "library_search_rejected",
      reason,
      type: fields.type,
      companion_type: fields.companion_type,
      mood_tag: fields.mood_tag,
      candidate_pool_size: fields.candidate_pool_size ?? null,
      recently_seen_size: fields.recently_seen_size ?? null,
      detail: fields.detail ? fields.detail.slice(0, 200) : null,
      ts: new Date().toISOString(),
    }));
  } catch {
    console.warn(`[library] library_search_rejected reason=${reason} type=${fields.type}`);
  }
}

/**
 * Structured Edge log when the per-user freshness lookup (`user_companion_serves`) errors.
 *
 * Grep: `library_recent_serves_error` or `"holzen_event":"library_recent_serves_error"`.
 * When this fires, `searchLibrary` falls open (treats user as if no recent serves) rather
 * than rejecting library — so we see rejected=none but library serves ignore freshness
 * until this clears.
 */
function logLibraryRecentServesError(
  phase: "db_error" | "threw",
  fields: { companion_type: string | null; detail?: string },
): void {
  try {
    console.warn(JSON.stringify({
      holzen_event: "library_recent_serves_error",
      phase,
      companion_type: fields.companion_type,
      detail: fields.detail ? fields.detail.slice(0, 200) : null,
      ts: new Date().toISOString(),
    }));
  } catch {
    console.warn(`[library] library_recent_serves_error phase=${phase}`);
  }
}

/**
 * Search the local content library for FRESH entries this user hasn't seen recently.
 *
 * Returns entries sorted by quality and relevance, or empty array if:
 * - No matching entries exist
 * - All matching entries were seen by this user within the last
 *   `COMPANION_SERVE_FRESHNESS_DAYS` (unless includeStale=true)
 *
 * When the library phase rejects (returns []), emits a structured `library_search_rejected`
 * Edge log with a stable `reason` so the library → cache fallback becomes diagnosable.
 *
 * The library table may not exist yet (before migration) — returns empty gracefully.
 *
 * Candidate-pool sizing: we pull a wider window than the caller's `limit` before applying
 * the per-user freshness filter so that, when the top rows are all recently seen, lower-
 * ranked fresh rows still get a chance instead of being starved by `.limit()` + quality
 * sort. `limit` still bounds the *returned* slice.
 */
const LIBRARY_FRESHNESS_OVERSAMPLE = 5;
const LIBRARY_MIN_CANDIDATE_POOL = 100;

export async function searchLibrary(
  svcClient: SupabaseClient,
  options: LibrarySearchOptions,
): Promise<LibraryEntry[]> {
  const returnLimit = options.limit ?? 20;
  // When a userId is set we need to oversample so freshness exclusions don't starve fresh rows.
  const candidateLimit = options.userId && !options.includeStale
    ? Math.max(returnLimit * LIBRARY_FRESHNESS_OVERSAMPLE, LIBRARY_MIN_CANDIDATE_POOL)
    : returnLimit;

  try {
    let query = svcClient
      .from("content_library")
      .select(
        "id, type, title, author, summary, url, original_url, original_publication, key_quote, citation, finding, event_date, asset_class, analogy, recovery, mood_tag, tags, quality_score",
      )
      .eq("type", options.type)
      .eq("active", true)
      .order("quality_score", { ascending: false })
      .limit(candidateLimit);

    if (options.companionType) {
      query = query.contains("companion_types", [options.companionType]);
    }

    if (options.moodTag) {
      query = query.eq("mood_tag", options.moodTag);
    }

    const { data, error } = await query;
    if (error) {
      logLibrarySearchRejected("db_error", {
        type: options.type,
        companion_type: options.companionType ?? null,
        mood_tag: options.moodTag ?? null,
        detail: error.message,
      });
      return [];
    }
    if (!data || data.length === 0) {
      logLibrarySearchRejected("empty", {
        type: options.type,
        companion_type: options.companionType ?? null,
        mood_tag: options.moodTag ?? null,
      });
      return [];
    }

    let entries = data as LibraryEntry[];
    const totalCandidates = entries.length;

    // Exclude by title (from localStorage dedup hints)
    if (options.excludeTitles?.length) {
      const excludeSet = new Set(options.excludeTitles.map(t => t.toLowerCase()));
      entries = entries.filter(e => !excludeSet.has(e.title.toLowerCase()));
    }

    // ── Per-user freshness: exclude entries seen within COMPANION_SERVE_FRESHNESS_DAYS ──
    if (options.userId && !options.includeStale) {
      const recentlySeen = await getRecentlySeenLibraryIds(
        svcClient,
        options.userId,
        options.companionType,
      );
      if (recentlySeen.size > 0) {
        const freshEntries = entries.filter(e => !recentlySeen.has(e.id));
        if (freshEntries.length === 0) {
          logLibrarySearchRejected("all_seen", {
            type: options.type,
            companion_type: options.companionType ?? null,
            mood_tag: options.moodTag ?? null,
            candidate_pool_size: totalCandidates,
            recently_seen_size: recentlySeen.size,
          });
          return [];
        }
        entries = freshEntries;
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

    return entries.slice(0, returnLimit);
  } catch (e) {
    logLibrarySearchRejected("threw", {
      type: options.type,
      companion_type: options.companionType ?? null,
      mood_tag: options.moodTag ?? null,
      detail: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}

/**
 * Record that a user was served a library entry.
 * Uses the same user_companion_serves table as cache tracking.
 */
export function recordLibraryServe(
  svcClient: SupabaseClient,
  userId: string | undefined,
  libraryEntryId: string,
  companionType: string,
) {
  if (!userId) return;
  // Use library entry ID in the cache_entry_id column (repurposed for both cache and library)
  void Promise.resolve(
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
      ),
  ).catch((err: unknown) => {
      try {
        console.warn(
          JSON.stringify({
            fn: "recordLibraryServe",
            level: "warn",
            msg: err instanceof Error ? err.message : String(err),
          }),
        );
      } catch {
        /* ignore */
      }
    });
}

// ── Internal helpers ──

/**
 * Get IDs of library/cache entries this user has seen in the freshness window.
 *
 * Note: `user_companion_serves.cache_entry_id` holds both `companion_cache.id` and
 * `content_library.id` values (see migration `20260414180000_user_companion_serves_dual_entry_ids`),
 * but the two UUID spaces don't collide so it's safe to intersect against library IDs.
 *
 * On DB error or throw, emits `library_recent_serves_error` (stable grep target) and returns an
 * empty set — i.e. fails open: the caller will treat the user as if they have no recent serves
 * rather than force a reject. The tradeoff is intentional; we'd rather risk a repeat than
 * starve library entirely on a transient failure.
 */
async function getRecentlySeenLibraryIds(
  svcClient: SupabaseClient,
  userId: string,
  companionType?: string,
): Promise<Set<string>> {
  try {
    const windowStart = new Date(Date.now() - COMPANION_SERVE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();

    let query = svcClient
      .from("user_companion_serves")
      .select("cache_entry_id")
      .eq("user_id", userId)
      .gte("served_at", windowStart);

    if (companionType) {
      query = query.eq("companion_type", companionType);
    }

    const { data, error } = await query;
    if (error) {
      logLibraryRecentServesError("db_error", {
        companion_type: companionType ?? null,
        detail: error.message,
      });
      return new Set();
    }
    if (!data) return new Set();
    return new Set(
      data.map((r: { cache_entry_id?: string | null }) => r.cache_entry_id).filter((id): id is string => typeof id === "string"),
    );
  } catch (e) {
    logLibraryRecentServesError("threw", {
      companion_type: companionType ?? null,
      detail: e instanceof Error ? e.message : String(e),
    });
    return new Set();
  }
}

// ── Format converters ──

export function essayToSignal(entry: LibraryEntry): {
  title: string;
  body: string;
  source: string;
  url: string;
  quote?: string;
} {
  // Prefer the canonical first-publication URL (author's own venue) over a
  // syndicated mirror when both exist — the mirror is fine for ingestion but
  // attribution during a pause should point at the original author.
  return {
    title: entry.title,
    body: entry.summary,
    source: entry.author || "Unknown",
    url: entry.original_url || entry.url || "",
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
