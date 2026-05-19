import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Database } from '@/integrations/supabase/types';
import {
  buildMemberCacheKey,
  getLibraryBundleDisabledQueryOptions,
  getLibraryBundleQueryOptions,
  libraryBundleQueryPrefix,
  sortMemberPauses,
  type Collection,
  type CollectionItem,
  type CollectionMemberPause,
  type LibraryBundle,
  type LibraryListSortMode,
} from '@/features/pause/public-queries';

export type {
  Collection,
  CollectionItem,
  CollectionMemberPause,
  LibraryListSortMode,
};
export { libraryBundleQueryPrefix };

type CollectionsInsert = Database['public']['Tables']['collections']['Insert'];
type CollectionsUpdate = Database['public']['Tables']['collections']['Update'];

const CACHE_KEY_COLLECTIONS = 'holzen_library_collections';
const CACHE_KEY_COL_ITEMS = 'holzen_library_col_items';

export type UseLibraryOptions = {
  listSort?: LibraryListSortMode;
};

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/**
 * User collections; each membership row points at a `pause_instance_id`.
 * Loads `v_pause_full` rows for members only (no `library_items`).
 */
export function useLibrary(options?: UseLibraryOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listSort: LibraryListSortMode = options?.listSort ?? 'newest';
  const memberCacheKey = buildMemberCacheKey(listSort);

  const placeholderData = useMemo((): LibraryBundle | undefined => {
    if (!user) return undefined;
    const rawItems = readCache<CollectionMemberPause[]>(memberCacheKey) ?? [];
    const cols = readCache<Collection[]>(CACHE_KEY_COLLECTIONS) ?? [];
    const cis = readCache<CollectionItem[]>(CACHE_KEY_COL_ITEMS) ?? [];
    if (rawItems.length === 0 && cols.length === 0 && cis.length === 0) return undefined;
    return {
      collections: cols,
      collectionItems: cis,
      items: sortMemberPauses(rawItems, listSort),
      memberRowsLoadFailed: false,
    };
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
  /** Match prior `fetchAll`: spinner only when nothing to show yet (no placeholder / empty cache). */
  const loading =
    Boolean(user) &&
    query.isFetching &&
    collections.length === 0 &&
    collectionItems.length === 0 &&
    items.length === 0;
  const listLoadFailed = query.isError || Boolean(query.data?.memberRowsLoadFailed);

  useEffect(() => {
    const d = query.data;
    if (!d) return;
    if (d.items.length > 0) writeCache(memberCacheKey, d.items);
    writeCache(CACHE_KEY_COLLECTIONS, d.collections);
    writeCache(CACHE_KEY_COL_ITEMS, d.collectionItems);
  }, [query.data, memberCacheKey]);

  const bumpLibrary = useCallback(() => {
    if (!user) return;
    void queryClient.invalidateQueries({ queryKey: libraryBundleQueryPrefix(user.id) });
  }, [queryClient, user]);

  const addCollection = useCallback(
    async (col: Partial<Collection>) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('collections')
        .insert({ ...col, user_id: user.id } as CollectionsInsert)
        .select()
        .single();
      if (error) return null;
      bumpLibrary();
      return data as unknown as Collection;
    },
    [user, bumpLibrary],
  );

  const updateCollection = useCallback(
    async (id: string, updates: Partial<Collection>) => {
      await supabase.from('collections').update(updates as CollectionsUpdate).eq('id', id);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      await supabase.from('collections').delete().eq('id', id);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const addToCollection = useCallback(
    async (collectionId: string, pauseInstanceId: string) => {
      const exists = collectionItems.some(
        (ci) => ci.collection_id === collectionId && ci.pause_instance_id === pauseInstanceId,
      );
      if (exists) return null;
      const maxPos = collectionItems
        .filter((ci) => ci.collection_id === collectionId)
        .reduce((max, ci) => Math.max(max, ci.position), -1);
      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id: collectionId,
          pause_instance_id: pauseInstanceId,
          position: maxPos + 1,
        } as never)
        .select()
        .single();
      if (error) return null;
      bumpLibrary();
      return data as unknown as CollectionItem;
    },
    [collectionItems, bumpLibrary],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, pauseInstanceId: string) => {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('pause_instance_id', pauseInstanceId);
      bumpLibrary();
    },
    [bumpLibrary],
  );

  const getCollectionItemIds = useCallback(
    (collectionId: string) =>
      collectionItems
        .filter((ci) => ci.collection_id === collectionId)
        .sort((a, b) => a.position - b.position)
        .map((ci) => ci.pause_instance_id),
    [collectionItems],
  );

  const getCollectionItemCount = useCallback(
    (collectionId: string) => collectionItems.filter((ci) => ci.collection_id === collectionId).length,
    [collectionItems],
  );

  const getItemCollections = useCallback(
    (pauseInstanceId: string) => {
      const colIds = collectionItems.filter((ci) => ci.pause_instance_id === pauseInstanceId).map((ci) => ci.collection_id);
      return collections.filter((c) => colIds.includes(c.id));
    },
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
