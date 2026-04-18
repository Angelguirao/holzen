/**
 * Pure helpers for `RelatedBiasesThisMonth`. Extracted so Vitest can import
 * them without pulling the Supabase client chain (importing the component
 * itself triggers `src/integrations/supabase/client.ts` side effects).
 */

export interface RelatedBiasesRow {
  reflection_id: string;
  created_at: string | null;
  content: { title?: string } | null;
}

export interface RelatedBias {
  title: string;
  reflection_id: string;
}

/**
 * Normalize a Grounding title so "Anchoring bias." and "anchoring bias"
 * collapse into the same bias key. Trailing punctuation (. , ; : — -) is
 * stripped because the structuring prompt doesn't constrain it.
 */
export function normalizeBiasTitle(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[\s.,;:—-]+$/g, '').trim();
}

/**
 * Dedupe raw `reflection_companions` rows into a list of distinct biases by
 * normalized title. Assumes input is ordered newest-first so the surviving
 * row per key is the most recent occurrence (chips deep-link to the freshest
 * card for that bias). Excludes the current title and the current reflection.
 */
export function dedupeBiases(
  rows: RelatedBiasesRow[],
  opts: { currentReflectionId: string | null; currentTitle: string | null; limit: number },
): RelatedBias[] {
  const currentKey = normalizeBiasTitle(opts.currentTitle ?? '');
  const seen = new Set<string>();
  const out: RelatedBias[] = [];
  for (const r of rows) {
    const title = r.content?.title?.trim();
    if (!title) continue;
    const key = normalizeBiasTitle(title);
    if (!key || key === currentKey) continue;
    if (seen.has(key)) continue;
    if (r.reflection_id === opts.currentReflectionId) continue;
    seen.add(key);
    out.push({ title, reflection_id: r.reflection_id });
    if (out.length >= opts.limit) break;
  }
  return out;
}
