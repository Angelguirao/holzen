import type { LibraryItem } from '@/hooks/use-library';

/** Tokenize a string into lowercase word set */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

/** Jaccard similarity between two strings (0–1) */
function similarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

export interface DuplicateGroup {
  /** The "primary" item (oldest) */
  primary: LibraryItem;
  /** The duplicates (newer items similar to primary) */
  duplicates: LibraryItem[];
  /** Average similarity score within the group */
  score: number;
}

const SIMILARITY_THRESHOLD = 0.6;

/**
 * Detect near-duplicate pause bookmarks in the library (`source_type === 'reflection'`).
 * Groups items by text similarity using Jaccard index on word tokens.
 * Only considers items with a body.
 */
export function detectDuplicates(items: LibraryItem[]): DuplicateGroup[] {
  const reflectionBookmarks = items.filter(
    (i) => i.source_type === 'reflection' && i.body && i.body.length > 20 && i.status !== 'deleted'
  );

  if (reflectionBookmarks.length < 2) return [];

  // Sort oldest first so the "primary" is the original
  const sorted = [...reflectionBookmarks].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const assigned = new Set<string>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (assigned.has(sorted[i].id)) continue;
    const primary = sorted[i];
    const duplicates: { item: LibraryItem; score: number }[] = [];

    for (let j = i + 1; j < sorted.length; j++) {
      if (assigned.has(sorted[j].id)) continue;
      const score = similarity(primary.body!, sorted[j].body!);
      if (score >= SIMILARITY_THRESHOLD) {
        duplicates.push({ item: sorted[j], score });
        assigned.add(sorted[j].id);
      }
    }

    if (duplicates.length > 0) {
      assigned.add(primary.id);
      const avgScore =
        duplicates.reduce((sum, d) => sum + d.score, 0) / duplicates.length;
      groups.push({
        primary,
        duplicates: duplicates.map((d) => d.item),
        score: Math.round(avgScore * 100) / 100,
      });
    }
  }

  return groups;
}
