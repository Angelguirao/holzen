import type { CollectionMemberPause, LibraryListSortMode } from '@/legacy/archive-collections/domain/library-bundle';

export function buildMemberCacheKey(listSort: LibraryListSortMode): string {
  return `holzen_collection_member_pauses:${listSort}`;
}

export function sortMemberPauses(
  rows: CollectionMemberPause[],
  listSort: LibraryListSortMode,
): CollectionMemberPause[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ta = new Date(a.terminal_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.terminal_at ?? b.created_at ?? 0).getTime();
    if (listSort === 'oldest') return ta - tb;
    if (listSort === 'alphabetical')
      return (a.source ?? '').localeCompare(b.source ?? '', undefined, { sensitivity: 'base' });
    return tb - ta;
  });
  return copy;
}
