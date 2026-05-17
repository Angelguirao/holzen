/**
 * Companion catalog — curated rows in `companion_catalog` with per-user freshness.
 *
 * Generators try this **catalog** phase first, then `companion_cache`, then live AI.
 * Phase ordering: `_shared/phase-config.ts` (`COMPANION_PHASE_CATALOG`).
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { COMPANION_SERVE_FRESHNESS_DAYS } from "./companion-serve-freshness.ts";

export interface CatalogEntry {
  id: string;
  type: string;
  title: string;
  author: string | null;
  summary: string;
  url: string | null;
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

/** @deprecated Use `CatalogEntry` — alias for pre-rename call sites. */
export type LibraryEntry = CatalogEntry;

export interface CatalogSearchOptions {
  type: string;
  userId?: string;
  companionType?: string;
  preferTags?: string[];
  moodTag?: string;
  excludeTitles?: string[];
  limit?: number;
  includeStale?: boolean;
}

/** @deprecated Use `CatalogSearchOptions`. */
export type LibrarySearchOptions = CatalogSearchOptions;

type CatalogSearchRejectReason = "db_error" | "empty" | "all_seen" | "threw";

function logCatalogSearchRejected(
  reason: CatalogSearchRejectReason,
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
      holzen_event: "catalog_search_rejected",
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
    console.warn(`[catalog] catalog_search_rejected reason=${reason} type=${fields.type}`);
  }
}

function logCatalogRecentServesError(
  phase: "db_error" | "threw",
  fields: { companion_type: string | null; detail?: string },
): void {
  try {
    console.warn(JSON.stringify({
      holzen_event: "catalog_recent_serves_error",
      phase,
      companion_type: fields.companion_type,
      detail: fields.detail ? fields.detail.slice(0, 200) : null,
      ts: new Date().toISOString(),
    }));
  } catch {
    console.warn(`[catalog] catalog_recent_serves_error phase=${phase}`);
  }
}

const CATALOG_FRESHNESS_OVERSAMPLE = 5;
const CATALOG_MIN_CANDIDATE_POOL = 100;

export async function searchCompanionCatalog(
  svcClient: SupabaseClient,
  options: CatalogSearchOptions,
): Promise<CatalogEntry[]> {
  const returnLimit = options.limit ?? 20;
  const candidateLimit = options.userId && !options.includeStale
    ? Math.max(returnLimit * CATALOG_FRESHNESS_OVERSAMPLE, CATALOG_MIN_CANDIDATE_POOL)
    : returnLimit;

  try {
    let query = svcClient
      .from("companion_catalog")
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
      logCatalogSearchRejected("db_error", {
        type: options.type,
        companion_type: options.companionType ?? null,
        mood_tag: options.moodTag ?? null,
        detail: error.message,
      });
      return [];
    }
    if (!data || data.length === 0) {
      logCatalogSearchRejected("empty", {
        type: options.type,
        companion_type: options.companionType ?? null,
        mood_tag: options.moodTag ?? null,
      });
      return [];
    }

    let entries = data as CatalogEntry[];
    const totalCandidates = entries.length;

    if (options.excludeTitles?.length) {
      const excludeSet = new Set(options.excludeTitles.map((t) => t.toLowerCase()));
      entries = entries.filter((e) => !excludeSet.has(e.title.toLowerCase()));
    }

    if (options.userId && !options.includeStale) {
      const recentlySeen = await getRecentlySeenCatalogIds(
        svcClient,
        options.userId,
        options.companionType,
      );
      if (recentlySeen.size > 0) {
        const freshEntries = entries.filter((e) => !recentlySeen.has(e.id));
        if (freshEntries.length === 0) {
          logCatalogSearchRejected("all_seen", {
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

    if (options.preferTags?.length) {
      const tagSet = new Set(options.preferTags.map((t) => t.toLowerCase()));
      entries.sort((a, b) => {
        const aMatches = a.tags.filter((t) => tagSet.has(t)).length;
        const bMatches = b.tags.filter((t) => tagSet.has(t)).length;
        return bMatches - aMatches;
      });
    }

    return entries.slice(0, returnLimit);
  } catch (e) {
    logCatalogSearchRejected("threw", {
      type: options.type,
      companion_type: options.companionType ?? null,
      mood_tag: options.moodTag ?? null,
      detail: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}

/** @deprecated Use `searchCompanionCatalog`. */
export const searchLibrary = searchCompanionCatalog;

export function recordCatalogServe(
  svcClient: SupabaseClient,
  userId: string | undefined,
  catalogEntryId: string,
  companionType: string,
) {
  if (!userId) return;
  void Promise.resolve(
    svcClient
      .from("user_companion_serves")
      .upsert(
        {
          user_id: userId,
          cache_entry_id: catalogEntryId,
          companion_type: companionType,
          served_at: new Date().toISOString(),
        },
        { onConflict: "user_id,cache_entry_id" },
      ),
  ).catch((err: unknown) => {
    try {
      console.warn(
        JSON.stringify({
          fn: "recordCatalogServe",
          level: "warn",
          msg: err instanceof Error ? err.message : String(err),
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

/** @deprecated Use `recordCatalogServe`. */
export const recordLibraryServe = recordCatalogServe;

async function getRecentlySeenCatalogIds(
  svcClient: SupabaseClient,
  userId: string,
  companionType?: string,
): Promise<Set<string>> {
  try {
    const windowStart = new Date(
      Date.now() - COMPANION_SERVE_FRESHNESS_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

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
      logCatalogRecentServesError("db_error", {
        companion_type: companionType ?? null,
        detail: error.message,
      });
      return new Set();
    }
    if (!data) return new Set();
    return new Set(
      data
        .map((r: { cache_entry_id?: string | null }) => r.cache_entry_id)
        .filter((id): id is string => typeof id === "string"),
    );
  } catch (e) {
    logCatalogRecentServesError("threw", {
      companion_type: companionType ?? null,
      detail: e instanceof Error ? e.message : String(e),
    });
    return new Set();
  }
}

export function essayToSignal(entry: CatalogEntry): {
  title: string;
  body: string;
  source: string;
  url: string;
  quote?: string;
} {
  return {
    title: entry.title,
    body: entry.summary,
    source: entry.author || "Unknown",
    url: entry.original_url || entry.url || "",
    ...(entry.key_quote ? { quote: entry.key_quote } : {}),
  };
}

export function paperToGrounding(entry: CatalogEntry): {
  title: string;
  body: string;
  citation: string;
  url: string;
} {
  return {
    title: entry.title,
    body: entry.finding || entry.summary,
    citation: entry.citation || `${entry.author}, ${entry.title}`,
    url: entry.url || "",
  };
}

export function eventToHistory(entry: CatalogEntry): {
  title: string;
  btcInsight: string;
  analogy: string;
  assetClass: string;
  period: string;
  recovery?: string;
  source?: string;
  url?: string;
} {
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
