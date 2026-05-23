import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/public';
import {
  collectionsContainingPauseInstance,
  countCollectionItems,
  hasCollectionMembership,
  nextCollectionItemPosition,
  sortedPauseInstanceIdsInCollection,
} from '@/legacy/archive-collections/application/use-cases/library/library-bundle-collection-helpers';
import {
  buildLibraryBundlePlaceholder,
  isLibraryBundleInitialLoading,
} from '@/legacy/archive-collections/application/use-cases/library/library-bundle-placeholder';
import {
  persistLibraryBundleToLocalStorage,
  readLibraryBundleCacheSnapshot,
} from '@/legacy/archive-collections/infrastructure/library-bundle-local-storage';
import { libraryBundleQueryPrefix } from '@/legacy/archive-collections/application/queries/library-bundle-keys';
import type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryBundle,
  LibraryListSortMode,
} from '@/legacy/archive-collections/domain/library-bundle';
import {
  buildMemberCacheKey,
  getLibraryBundleDisabledQueryOptions,
  getLibraryBundleQueryOptions,
} from '@/legacy/archive-collections/infrastructure/queries/library-bundle-query';
import {
  deleteLibraryCollection,
  insertLibraryCollection,
  insertLibraryCollectionItem,
  removeLibraryCollectionItem,
  updateLibraryCollection,
} from '@/legacy/archive-collections/infrastructure/queries/library-collections-mutations';

export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryListSortMode,
};

export type UsePauseLibraryBundleOptions = {
  listSort?: LibraryListSortMode;
};

/**
 * User collections; each membership row points at a `pause_instance_id`.
 * Loads `v_pause_full` rows for members only (no `library_items`).
 */
export function usePauseLibraryBundle(options?: UsePauseLibraryBundleOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listSort: LibraryListSortMode = options?.listSort ?? 'newest';
  const memberCacheKey = buildMemberCacheKey(listSort);

  const placeholderData = useMemo((): LibraryBundle | undefined => {
    if (!user) return undefined;
    const snapshot = readLibraryBundleCacheSnapshot(memberCacheKey);
    return buildLibraryBundlePlaceholder({ listSort, ...snapshot });
  }, [user, memberCacheKey, listSort]);

  const query = useQuery({
    ...(user
      ? getLibraryBundleQueryOptions({
          userId: user.id,
          listSort,
          memberCacheKey,
          t,
        })
      : getLibraryBundleDisabledQueryOptions(listSort)),
    enabled: Boolean(user),
    placeholderData,
  });

  const items = query.data?.items ?? [];
  const collections = query.data?.collections ?? [];
  const collectionItems = query.data?.collectionItems ?? [];
  const loading = isLibraryBundleInitialLoading({
    hasUser: Boolean(user),
    isFetching: query.isFetching,
    collectionCount: collections.length,
    collectionItemCount: collectionItems.length,
    itemCount: items.length,
  });
  const listLoadFailed = query.isError || Boolean(query.data?.memberRowsLoadFailed);

  useEffect(() => {
    const d = query.data;
    if (!d) return;
    persistLibraryBundleToLocalStorage(memberCacheKey, d);
  }, [query.data, memberCacheKey]);

  const bumpLibrary = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: libraryBundleQueryPrefix(user.id) });
  }, [queryClient, user]);

  const addCollection = useCallback(
    async (col: Partial<Collection>) => {
      if (!user) return null;
      const data = await insertLibraryCollection(user.id, col);
      if (!data) return null;
      bumpLibrary();
      return data;
    },
    [user, bumpLibrary],
  );

  const updateCollection = useCallback(
    async (id: string, updates: Partial<Collection>) => {
      await updateLibraryCollection(id, updates);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      await deleteLibraryCollection(id);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const addToCollection = useCallback(
    async (collectionId: string, pauseInstanceId: string) => {
      if (hasCollectionMembership(collectionItems, collectionId, pauseInstanceId)) return null;
      const data = await insertLibraryCollectionItem({
        collectionId,
        pauseInstanceId,
        position: nextCollectionItemPosition(collectionItems, collectionId),
      });
      if (!data) return null;
      bumpLibrary();
      return data;
    },
    [collectionItems, bumpLibrary],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, pauseInstanceId: string) => {
      await removeLibraryCollectionItem(collectionId, pauseInstanceId);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const getCollectionItemIds = useCallback(
    (collectionId: string) => sortedPauseInstanceIdsInCollection(collectionItems, collectionId),
    [collectionItems],
  );

  const getCollectionItemCount = useCallback(
    (collectionId: string) => countCollectionItems(collectionItems, collectionId),
    [collectionItems],
  );

  const getItemCollections = useCallback(
    (pauseInstanceId: string) =>
      collectionsContainingPauseInstance(collections, collectionItems, pauseInstanceId),
    [collectionItems, collections],
  );

  const loadMore = useCallback(async () => {
    /* no pagination */
  }, []);

  return {
    items,
    collections,
    collectionItems,
    loading,
    listLoadFailed,
    loadingMore: false,
    hasMore: false,
    loadMore,
    addCollection,
    updateCollection,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    getCollectionItemIds,
    getCollectionItemCount,
    getItemCollections,
    refetch: () => void query.refetch(),
  };
}
