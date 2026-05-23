/**
 * Pure helpers for related grounding biases (Ground nudge artifacts).
 */

export interface RelatedBiasesRow {
  pause_instance_id: string;
  created_at: string | null;
  content: { title?: string } | null;
}

export interface RelatedBias {
  title: string;
  pause_instance_id: string;
}

export function normalizeBiasTitle(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[\s.,;:—-]+$/g, '').trim();
}

export function dedupeBiases(
  rows: RelatedBiasesRow[],
  opts: { currentPauseInstanceId: string | null; currentTitle: string | null; limit: number },
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
    if (r.pause_instance_id === opts.currentPauseInstanceId) continue;
    seen.add(key);
    out.push({ title, pause_instance_id: r.pause_instance_id });
    if (out.length >= opts.limit) break;
  }
  return out;
}
