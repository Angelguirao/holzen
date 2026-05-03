import { useState, useEffect, useCallback } from 'react';
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

/**
 * User collections; each membership row points at a `pause_instance_id`.
 * Loads `v_pause_full` rows for members only (no `library_items`).
 */
export function useLibrary(options?: UseLibraryOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const listSort: LibraryListSortMode = options?.listSort ?? 'newest';
  const memberCacheKey = buildMemberCacheKey(listSort);

  const [items, setItems] = useState<CollectionMemberPause[]>(() => readCache<CollectionMemberPause[]>(memberCacheKey) ?? []);
  const [collections, setCollections] = useState<Collection[]>(() => readCache<Collection[]>(CACHE_KEY_COLLECTIONS) ?? []);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>(() => readCache<CollectionItem[]>(CACHE_KEY_COL_ITEMS) ?? []);
  const [loading, setLoading] = useState(true);
  const [listLoadFailed, setListLoadFailed] = useState(false);

  const fetchPausesForIds = useCallback(async (userId: string, ids: string[]) => {
    if (ids.length === 0) return { data: [] as CollectionMemberPause[], error: null as null };
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
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setListLoadFailed(false);
      return;
    }
    const cached = readCache<CollectionMemberPause[]>(memberCacheKey) ?? [];
    setItems(cached);
    setLoading(cached.length === 0);

    const [rCols, rColItems] = await Promise.all([
      supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('collection_items')
        .select('*')
        .order('position', { ascending: true }),
    ]);

    if (!rCols.error) {
      const cols = (rCols.data as unknown as Collection[]) ?? [];
      setCollections(cols);
      writeCache(CACHE_KEY_COLLECTIONS, cols);
    }
    if (!rColItems.error) {
      const cis = (rColItems.data as unknown as CollectionItem[]) ?? [];
      setCollectionItems(cis);
      writeCache(CACHE_KEY_COL_ITEMS, cis);
    }
    if (rCols.error || rColItems.error) {
      toast.error(t('library.collectionsPartialLoadFailed'));
      setListLoadFailed(true);
      setLoading(false);
      return;
    }

    const cols = (rCols.data as unknown as Collection[]) ?? [];
    const cis = (rColItems.data as unknown as CollectionItem[]) ?? [];
    const colIds = new Set(cols.map((c) => c.id));
    const pauseIds = [...new Set(cis.filter((ci) => colIds.has(ci.collection_id)).map((ci) => ci.pause_instance_id))];

    const { data: raw, error: pErr } = await fetchPausesForIds(user.id, pauseIds);
    if (pErr != null || raw == null) {
      setListLoadFailed(true);
      setLoading(false);
      return;
    }

    const sorted = sortMemberPauses(raw, listSort);
    setItems(sorted);
    setListLoadFailed(false);
    setLoading(false);
    writeCache(memberCacheKey, sorted);
  }, [user, t, memberCacheKey, fetchPausesForIds, listSort]);

  const loadMore = useCallback(async () => {
    /* no pagination */
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (items.length > 0) writeCache(memberCacheKey, items);
  }, [items, memberCacheKey]);
  useEffect(() => {
    writeCache(CACHE_KEY_COLLECTIONS, collections);
  }, [collections]);
  useEffect(() => {
    writeCache(CACHE_KEY_COL_ITEMS, collectionItems);
  }, [collectionItems]);

  const addCollection = useCallback(async (col: Partial<Collection>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('collections')
      .insert({ ...col, user_id: user.id } as CollectionsInsert)
      .select()
      .single();
    if (error) return null;
    const newCol = data as unknown as Collection;
    setCollections((prev) => [newCol, ...prev]);
    return newCol;
  }, [user]);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    await supabase.from('collections').update(updates as CollectionsUpdate).eq('id', id);
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCollection = useCallback(
    async (id: string) => {
      await supabase.from('collections').delete().eq('id', id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      setCollectionItems((prev) => {
        const next = prev.filter((ci) => ci.collection_id !== id);
        const kept = new Set(next.map((ci) => ci.pause_instance_id));
        setItems((prevRows) => {
          const pruned = prevRows.filter((r) => r.id && kept.has(r.id));
          writeCache(memberCacheKey, pruned);
          return pruned;
        });
        return next;
      });
    },
    [memberCacheKey],
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
      const newCI = data as unknown as CollectionItem;
      setCollectionItems((prev) => [...prev, newCI]);

      if (user && !items.some((r) => r.id === pauseInstanceId)) {
        const { data: row } = await supabase
          .from('v_pause_full' as never)
          .select('*')
          .eq('id', pauseInstanceId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (row) {
          const p = row as unknown as CollectionMemberPause;
          setItems((prevRows) => {
            if (prevRows.some((r) => r.id === p.id)) return prevRows;
            const next = sortMemberPauses([...prevRows, p], listSort);
            writeCache(memberCacheKey, next);
            return next;
          });
        }
      }

      return newCI;
    },
    [collectionItems, user, items, listSort, memberCacheKey],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, pauseInstanceId: string) => {
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('pause_instance_id', pauseInstanceId);
      setCollectionItems((prev) => {
        const next = prev.filter((ci) => !(ci.collection_id === collectionId && ci.pause_instance_id === pauseInstanceId));
        const kept = new Set(next.map((ci) => ci.pause_instance_id));
        setItems((prevRows) => {
          const pruned = prevRows.filter((r) => r.id && kept.has(r.id));
          writeCache(memberCacheKey, pruned);
          return pruned;
        });
        return next;
      });
    },
    [memberCacheKey],
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
    refetch: fetchAll,
  };
}
