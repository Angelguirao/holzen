/**
 * Shared dedup helpers for content_library inserts and companion_cache pregeneration.
 * Keep normalization aligned with DB generated columns where applicable.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { FeedArticleRef } from "./feed-ingest.ts";

/** Trim, lowercase, collapse internal whitespace — matches content_library.title_norm in SQL. */
export function normalizeTitleKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Stable article URL for dedup: no query/hash, lowercase host, no trailing slash on path. */
export function canonicalContentUrl(raw: string): string | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    u.hash = "";
    u.search = "";
    const host = u.hostname.replace(/^www\./i, "").toLowerCase();
    const path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${host}${path}`;
  } catch {
    return null;
  }
}

/** URL strings to match against content_library.url (raw + canonical variants). */
export function urlDedupCandidates(raw: string | null | undefined): string[] {
  if (!raw || raw.length < 4) return [];
  const out = new Set<string>();
  const t = raw.trim();
  if (t) out.add(t);
  const c = canonicalContentUrl(t);
  if (c) {
    out.add(c);
    try {
      const u = new URL(c);
      if (!u.hostname.startsWith("www.")) {
        out.add(`${u.protocol}//www.${u.hostname}${u.pathname}`);
      }
    } catch {
      /* ignore */
    }
  }
  return [...out];
}

/**
 * Drop article refs whose URL (or a canonical variant) already exists in `content_library`.
 * Use before ingest so each cron run does not walk the same known URLs from index 0 and burn
 * attempt budget on `dedup_url_pre_scrape` skips.
 */
export function partitionArticleRefsByUrlInDb(
  refs: FeedArticleRef[],
  urlsPresentInDb: Set<string>,
): { pending: FeedArticleRef[]; skippedKnown: number } {
  const pending: FeedArticleRef[] = [];
  let skippedKnown = 0;
  for (const ref of refs) {
    const cands = urlDedupCandidates(ref.url);
    if (cands.length === 0) {
      pending.push(ref);
      continue;
    }
    if (cands.some((c) => urlsPresentInDb.has(c))) {
      skippedKnown++;
    } else {
      pending.push(ref);
    }
  }
  return { pending, skippedKnown };
}

const CONTENT_LIBRARY_URL_IN_CHUNK = 120;

export async function filterArticleRefsNotInLibrary(
  svcClient: SupabaseClient,
  contentType: "essay" | "paper",
  refs: FeedArticleRef[],
): Promise<{ pending: FeedArticleRef[]; skippedKnown: number; batchQueryOk: boolean }> {
  if (refs.length === 0) return { pending: [], skippedKnown: 0, batchQueryOk: true };

  const allCandidates = new Set<string>();
  for (const ref of refs) {
    for (const c of urlDedupCandidates(ref.url)) {
      allCandidates.add(c);
    }
  }
  const flat = [...allCandidates];
  if (flat.length === 0) {
    return { pending: refs, skippedKnown: 0, batchQueryOk: true };
  }

  const urlsPresentInDb = new Set<string>();
  let batchQueryOk = true;
  for (let i = 0; i < flat.length; i += CONTENT_LIBRARY_URL_IN_CHUNK) {
    const chunk = flat.slice(i, i + CONTENT_LIBRARY_URL_IN_CHUNK);
    const { data, error } = await svcClient
      .from("content_library")
      .select("url")
      .eq("type", contentType)
      .eq("active", true)
      .in("url", chunk);
    if (error) {
      console.warn("[filterArticleRefsNotInLibrary] chunk query failed", error);
      batchQueryOk = false;
      continue;
    }
    if (data) {
      for (const row of data) {
        if (row.url) urlsPresentInDb.add(row.url);
      }
    }
  }

  const { pending, skippedKnown } = partitionArticleRefsByUrlInDb(refs, urlsPresentInDb);
  return { pending, skippedKnown, batchQueryOk };
}

function normalizeSnippetForFingerprint(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 500);
}

async function sha256HexPrefix(s: string, byteLen = 16): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf).slice(0, byteLen))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Fingerprint first ~500 chars of body-ish text for near-duplicate companion_cache rows. */
export async function contentSnippetFingerprint(text: string): Promise<string | null> {
  const n = normalizeSnippetForFingerprint(text);
  if (n.length < 24) return null;
  return sha256HexPrefix(n, 16);
}

export interface CompanionCacheDedupOpts {
  url?: string | null;
  /** First paragraph / insight text — hashed when long enough */
  bodySnippet?: string | null;
}

/**
 * True if this companion_type already has a row matching normalized title, canonical URL,
 * content fingerprint, or (legacy) fuzzy title similarity among recent entries.
 */
export async function isCompanionCacheDuplicate(
  svcClient: SupabaseClient,
  companionType: string,
  newTitle: string,
  opts?: CompanionCacheDedupOpts,
): Promise<boolean> {
  if (!newTitle || newTitle.trim().length < 3) return false;
  const norm = normalizeTitleKey(newTitle);
  const canonical = opts?.url ? canonicalContentUrl(opts.url) : null;
  let fp: string | null = null;
  if (opts?.bodySnippet && opts.bodySnippet.length > 24) {
    fp = await contentSnippetFingerprint(opts.bodySnippet);
  }

  const base = () =>
    svcClient.from("companion_cache").select("id").eq("companion_type", companionType).eq("language", "en");

  const { data: byNorm } = await base().eq("title_norm", norm).limit(1);
  if (byNorm && byNorm.length > 0) return true;
  if (canonical) {
    const { data: byUrl } = await base().eq("source_url", canonical).limit(1);
    if (byUrl && byUrl.length > 0) return true;
  }
  if (fp) {
    const { data: byFp } = await base().eq("fingerprint", fp).limit(1);
    if (byFp && byFp.length > 0) return true;
  }

  const { data } = await svcClient
    .from("companion_cache")
    .select("content")
    .eq("companion_type", companionType)
    .eq("language", "en")
    .order("created_at", { ascending: false })
    .limit(120);

  if (!data || data.length === 0) return false;

  const normalizeFuzzy = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const newNorm = normalizeFuzzy(newTitle);
  const newWords = new Set(newNorm.split(/\s+/).filter((w) => w.length > 3));

  for (const row of data) {
    const existingTitle = (row.content as { title?: string })?.title;
    if (!existingTitle) continue;
    const existNorm = normalizeFuzzy(existingTitle);
    if (existNorm === newNorm) return true;
    if (existNorm.includes(newNorm) || newNorm.includes(existNorm)) return true;
    const existWords = new Set(existNorm.split(/\s+/).filter((w: string) => w.length > 3));
    if (newWords.size === 0 || existWords.size === 0) continue;
    let overlap = 0;
    for (const w of newWords) {
      if (existWords.has(w)) overlap++;
    }
    const overlapRatio = overlap / Math.min(newWords.size, existWords.size);
    if (overlapRatio > 0.6) return true;
  }
  return false;
}
