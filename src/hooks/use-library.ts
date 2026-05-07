import { useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Database } from '@/integrations/supabase/types';
import type { PauseArchiveRow } from '@/hooks/use-pause-archive-list';

type CollectionsInsert = Database['public']['Tables']['collections']['Insert'];
type CollectionsUpdate = Database['public']['Tables']['collections']['Update'];

export type CollectionMemberPause = PauseArchiveRow;

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  pause_instance_id: string;
  position: number;
  added_at: string;
}

const CACHE_KEY_COLLECTIONS = 'holzen_library_collections';
const CACHE_KEY_COL_ITEMS = 'holzen_library_col_items';
const PAUSE_IN_CHUNK = 80;

export type LibraryListSortMode = 'newest' | 'oldest' | 'alphabetical';

export type UseLibraryOptions = {
  listSort?: LibraryListSortMode;
};

function buildMemberCacheKey(listSort: LibraryListSortMode): string {
  return `holzen_collection_member_pauses:${listSort}`;
}

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

function sortMemberPauses(rows: CollectionMemberPause[], listSort: LibraryListSortMode): CollectionMemberPause[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const ta = new Date(a.terminal_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.terminal_at ?? b.created_at ?? 0).getTime();
    if (listSort === 'oldest') return ta - tb;
    if (listSort === 'alphabetical') return (a.source ?? '').localeCompare(b.source ?? '', undefined, { sensitivity: 'base' });
    return tb - ta;
  });
  return copy;
}

/** Prefix for TanStack invalidation (e.g. pause completion → refresh member rows). */
export function libraryBundleQueryPrefix(userId: string) {
  return ['library', 'bundle', userId] as const;
}

type LibraryBundle = {
  collections: Collection[];
  collectionItems: CollectionItem[];
  items: CollectionMemberPause[];
  /** True when `v_pause_full` member fetch failed but collections + items loaded. */
  memberRowsLoadFailed: boolean;
};

async function fetchLibraryMemberPausesForIds(
  userId: string,
  ids: string[],
): Promise<{ data: CollectionMemberPause[] | null; error: unknown }> {
  if (ids.length === 0) return { data: [], error: null };
  const merged: CollectionMemberPause[] = [];
  for (let i = 0; i < ids.length; i += PAUSE_IN_CHUNK) {
    const chunk = ids.slice(i, i + PAUSE_IN_CHUNK);
    const { data, error } = await supabase
      .from('v_pause_full' as never)
      .select('*')
      .eq('user_id', userId)
      .in('id', chunk);
    if (error) return { data: null, error };
    merged.push(...((data ?? []) as unknown as CollectionMemberPause[]));
  }
  return { data: merged, error: null };
}

async function fetchLibraryBundle(
  userId: string,
  listSort: LibraryListSortMode,
  memberCacheKey: string,
  t: (key: string) => string,
): Promise<LibraryBundle> {
  const [rCols, rColItems] = await Promise.all([
    supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('collection_items').select('*').order('position', { ascending: true }),
  ]);

  if (rCols.error || rColItems.error) {
    toast.error(t('library.collectionsPartialLoadFailed'));
    throw rCols.error ?? rColItems.error;
  }

  const cols = (rCols.data as unknown as Collection[]) ?? [];
  const cis = (rColItems.data as unknown as CollectionItem[]) ?? [];
  const colIds = new Set(cols.map((c) => c.id));
  const pauseIds = [...new Set(cis.filter((ci) => colIds.has(ci.collection_id)).map((ci) => ci.pause_instance_id))];

  const { data: raw, error: pErr } = await fetchLibraryMemberPausesForIds(userId, pauseIds);
  if (pErr != null || raw == null) {
    const cachedItems = readCache<CollectionMemberPause[]>(memberCacheKey) ?? [];
    return {
      collections: cols,
      collectionItems: cis,
      items: sortMemberPauses(cachedItems, listSort),
      memberRowsLoadFailed: true,
    };
  }

  return {
    collections: cols,
    collectionItems: cis,
    items: sortMemberPauses(raw, listSort),
    memberRowsLoadFailed: false,
  };
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
    queryKey: user ? [...libraryBundleQueryPrefix(user.id), listSort] : ['library', 'bundle', '__none__', listSort],
    queryFn: () => fetchLibraryBundle(user!.id, listSort, memberCacheKey, t),
    enabled: Boolean(user),
    placeholderData,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
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
