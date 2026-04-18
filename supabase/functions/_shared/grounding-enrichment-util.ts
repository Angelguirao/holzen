/**
 * Pure helpers for the `grounding-enrich` edge function, extracted so they
 * can be unit-tested from Vitest (the edge function itself relies on
 * `deno.land/std` URL imports and can't be imported directly).
 */

/**
 * Normalize a citation string for hashing: collapse whitespace, lowercase,
 * strip trailing punctuation. Deterministic: same citation → same hash, which
 * is the basis of the shared cross-user cache in `grounding_enrichment_cache`.
 */
export function normalizeCitation(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s.,;]+$/g, "")
    .trim();
}

/**
 * Extract a DOI from arbitrary text (either the citation string or a URL).
 * DOI format per CrossRef: `10.\d{4,9}/[-._;()/:A-Z0-9]+` (case-insensitive).
 * Returns `null` when no DOI is present so callers can fall back to a
 * title-based fuzzy search against Crossref.
 */
export function extractDoi(text: string): string | null {
  if (!text) return null;
  const m = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return m ? m[0].replace(/[.,);]+$/, "") : null;
}
