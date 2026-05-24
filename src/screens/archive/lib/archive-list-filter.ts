import type { PauseArchiveRow } from '@/features/pause/public-hooks';
import type { ArchiveSortMode } from '@/screens/archive/lib/archive-screen-params';

function sortKey(r: PauseArchiveRow): string {
  return r.terminal_at ?? r.created_at ?? '';
}

export function rowMatchesArchiveSearch(row: PauseArchiveRow, q: string): boolean {
  const hay = [
    row.reflection_text,
    row.haiku_text,
    row.note_text,
    row.outcome,
    row.initial_mood,
    row.shift_mood,
    row.source,
    row.state,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export function collectArchiveTags(rows: PauseArchiveRow[]): string[] {
  const tagCount = new Map<string, number>();
  rows.forEach((r) => {
    (r.tags ?? []).forEach((tag) => {
      if (!tag) return;
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    });
  });
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

export function filterAndSortArchiveRows(
  rows: PauseArchiveRow[],
  options: {
    tagFilter: string | null;
    search: string;
    sortMode: ArchiveSortMode;
  },
): PauseArchiveRow[] {
  let result = rows;
  if (options.tagFilter) {
    result = result.filter((r) => (r.tags ?? []).includes(options.tagFilter!));
  }
  if (options.search.trim()) {
    const q = options.search.toLowerCase();
    result = result.filter((r) => rowMatchesArchiveSearch(r, q));
  }
  if (options.sortMode === 'oldest') {
    result = [...result].sort(
      (a, b) => new Date(sortKey(a)).getTime() - new Date(sortKey(b)).getTime(),
    );
  } else if (options.sortMode === 'alphabetical') {
    result = [...result].sort((a, b) => (a.source ?? '').localeCompare(b.source ?? ''));
  } else {
    result = [...result].sort(
      (a, b) => new Date(sortKey(b)).getTime() - new Date(sortKey(a)).getTime(),
    );
  }
  return result;
}
