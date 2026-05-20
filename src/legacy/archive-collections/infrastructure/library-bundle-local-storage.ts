import type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
} from '@/legacy/archive-collections/domain/library-bundle';
import { readJsonLocalStorage, writeJsonLocalStorage } from './json-local-storage';

export const LIBRARY_CACHE_KEY_COLLECTIONS = 'holzen_library_collections';
export const LIBRARY_CACHE_KEY_COLLECTION_ITEMS = 'holzen_library_col_items';

export function readLibraryBundleCacheSnapshot(memberCacheKey: string): {
  items: CollectionMemberPause[];
  collections: Collection[];
  collectionItems: CollectionItem[];
} {
  return {
    items: readJsonLocalStorage<CollectionMemberPause[]>(memberCacheKey) ?? [],
    collections: readJsonLocalStorage<Collection[]>(LIBRARY_CACHE_KEY_COLLECTIONS) ?? [],
    collectionItems: readJsonLocalStorage<CollectionItem[]>(LIBRARY_CACHE_KEY_COLLECTION_ITEMS) ?? [],
  };
}

export function persistLibraryBundleToLocalStorage(
  memberCacheKey: string,
  bundle: Pick<LibraryBundle, 'items' | 'collections' | 'collectionItems'>,
): void {
  if (bundle.items.length > 0) writeJsonLocalStorage(memberCacheKey, bundle.items);
  writeJsonLocalStorage(LIBRARY_CACHE_KEY_COLLECTIONS, bundle.collections);
  writeJsonLocalStorage(LIBRARY_CACHE_KEY_COLLECTION_ITEMS, bundle.collectionItems);
}
