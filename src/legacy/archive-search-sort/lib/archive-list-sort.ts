export type PauseArchiveListSort = 'newest' | 'oldest' | 'alphabetical';

type ArchiveListOrderBuilder = {
  order: (
    column: string,
    options: { ascending: boolean; nullsFirst: boolean },
  ) => ArchiveListOrderBuilder;
};

/** Apply list sort ordering to a Supabase query builder (archive list re-enable). */
export function applyPauseArchiveListSort<T extends ArchiveListOrderBuilder>(
  q: T,
  listSort: PauseArchiveListSort,
): T {
  if (listSort === 'alphabetical') {
    return q
      .order('source', { ascending: true, nullsFirst: false })
      .order('terminal_at', { ascending: false, nullsFirst: false }) as T;
  }
  if (listSort === 'oldest') {
    return q
      .order('terminal_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true }) as T;
  }
  return q
    .order('terminal_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false }) as T;
}

export function pauseArchiveStorageCacheKeyWithSort(
  segment: 'pauses' | 'echoes',
  favoritesOnly: boolean,
  sort: PauseArchiveListSort,
): string {
  return `holzen_pause_archive:${segment}:${favoritesOnly ? 'fav' : 'all'}:${sort}`;
}
