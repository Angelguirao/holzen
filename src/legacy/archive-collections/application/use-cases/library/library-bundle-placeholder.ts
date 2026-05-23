import type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from '@/legacy/archive-collections/domain/library-bundle';
import { sortMemberPauses } from './sort-member-pauses';

export function buildLibraryBundlePlaceholder(opts: {
  listSort: LibraryListSortMode;
  items: CollectionMemberPause[];
  collections: Collection[];
  collectionItems: CollectionItem[];
}): LibraryBundle | undefined {
  const { listSort, items, collections, collectionItems } = opts;
  if (items.length === 0 && collections.length === 0 && collectionItems.length === 0) {
    return undefined;
  }
  return {
    collections,
    collectionItems,
    items: sortMemberPauses(items, listSort),
    memberRowsLoadFailed: false,
  };
}

/** Spinner only when signed in, fetching, and nothing to show yet (no placeholder / empty cache). */
export function isLibraryBundleInitialLoading(opts: {
  hasUser: boolean;
  isFetching: boolean;
  collectionCount: number;
  collectionItemCount: number;
  itemCount: number;
}): boolean {
  return (
    opts.hasUser &&
    opts.isFetching &&
    opts.collectionCount === 0 &&
    opts.collectionItemCount === 0 &&
    opts.itemCount === 0
  );
}
