import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Database } from '@/integrations/supabase/types';
import {
  isMainPauseLibraryBookmark,
  normalizeLibrarySourceType,
} from '@/lib/normalize-library-source-type';
import type { PauseInstanceArchiveMeta } from '@/lib/archive-segment';

/** DB insert/update; `pause_instance_id` may exist in production before types.ts regen. */
type LibraryItemsInsert = Database['public']['Tables']['library_items']['Insert'] & {
  pause_instance_id?: string | null;
};
type LibraryItemsUpdate = Database['public']['Tables']['library_items']['Update'] & {
  pause_instance_id?: string | null;
};
type CollectionsInsert = Database['public']['Tables']['collections']['Insert'];
type CollectionsUpdate = Database['public']['Tables']['collections']['Update'];
type CollectionItemsInsert = Database['public']['Tables']['collection_items']['Insert'];

export interface LibraryItem {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  source_type: string | null;
  source_url: string | null;
  pause_instance_id: string | null;
  tags: string[];
  pinned: boolean;
  is_favorite: boolean;
  status: 'unread' | 'read' | 'archived' | 'deleted';
  created_at: string;
}

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
  library_item_id: string;
  position: number;
  added_at: string;
}

export interface ReflectionReadFlags {
  haiku_read: boolean;
  grounding_read: boolean;
  signal_read: boolean;
  zoom_out_read: boolean;
  history_read: boolean;
}

const CACHE_KEY_ITEMS = 'holzen_library_items';
const CACHE_KEY_ITEMS_FAVS = 'holzen_library_items_favs';
const CACHE_KEY_ITEMS_ECHO = 'holzen_library_items_echo';
const CACHE_KEY_ITEMS_Pauses_SEG = 'holzen_library_items_pauses_seg';
const CACHE_KEY_COLLECTIONS = 'holzen_library_collections';
const CACHE_KEY_COL_ITEMS = 'holzen_library_col_items';
const PAGE_SIZE = 50;

/** Which PostgREST relation backs the infinite list (see `supabase/migrations/*library_archive*.sql`). */
export type LibraryArchiveListKind = 'default' | 'echo' | 'pauses';

/** Server-side ordering for the active list (client may still re-sort after local filters). */
export type LibraryListSortMode = 'newest' | 'oldest' | 'alphabetical';

/** Filters applied in `library_archive_list_page` when listing Pauses / Echo segments. */
export type LibraryArchiveRpcFilters = {
  search: string;
  sourceTypes: string[];
  tag: string | null;
  smartIds: string[];
  /** Pauses “All” default: one main bookmark row per pause session (no active filters). */
  mainPauseBookmarkOnly: boolean;
};

const EMPTY_ARCHIVE_RPC_FILTERS: LibraryArchiveRpcFilters = {
  search: '',
  sourceTypes: [],
  tag: null,
  smartIds: [],
  mainPauseBookmarkOnly: false,
};

export type UseLibraryOptions = {
  archiveListKind?: LibraryArchiveListKind;
  /**
   * When true, restrict to favorites (`is_favorite`). Used with Pauses Favs pill
   * against `library_archive_pauses_tab_items` or legacy `library_items`.
   */
  favoritesOnly?: boolean;
  listSort?: LibraryListSortMode;
  /** When `archiveListKind` is `pauses` or `echo`, passed to `library_archive_list_page`. */
  archiveRpcFilters?: LibraryArchiveRpcFilters;
};

type LibraryItemsRelation = 'library_items' | 'library_archive_echo_items' | 'library_archive_pauses_tab_items';

function libraryTableForKind(kind: LibraryArchiveListKind): LibraryItemsRelation {
  if (kind === 'echo') return 'library_archive_echo_items';
  if (kind === 'pauses') return 'library_archive_pauses_tab_items';
  return 'library_items';
}

function buildItemsCacheKey(
  kind: LibraryArchiveListKind,
  favoritesOnly: boolean,
  listSort: LibraryListSortMode,
  usesArchiveRpc: boolean,
  rpcFilterKey: string,
): string {
  const sort = listSort;
  const rpc = usesArchiveRpc ? `:${rpcFilterKey}` : '';
  if (kind === 'echo') return `${CACHE_KEY_ITEMS_ECHO}:${sort}${rpc}`;
  if (kind === 'pauses') return `${CACHE_KEY_ITEMS_Pauses_SEG}:${favoritesOnly ? 'fav' : 'all'}:${sort}${rpc}`;
  if (favoritesOnly) return `${CACHE_KEY_ITEMS_FAVS}:${sort}`;
  return `${CACHE_KEY_ITEMS}:${sort}`;
}

function buildRpcFilterKey(f?: LibraryArchiveRpcFilters): string {
  const st = [...(f?.sourceTypes ?? [])].sort().join('\u0001');
  const sm = [...(f?.smartIds ?? [])].sort().join('\u0001');
  return JSON.stringify({
    s: f?.search ?? '',
    st,
    tag: f?.tag ?? '',
    sm,
    mp: f?.mainPauseBookmarkOnly ?? false,
  });
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function useLibrary(options?: UseLibraryOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const favoritesOnly = options?.favoritesOnly ?? false;
  const archiveListKind: LibraryArchiveListKind = options?.archiveListKind ?? 'default';
  const listSort: LibraryListSortMode = options?.listSort ?? 'newest';
  const usesArchiveRpcList = archiveListKind === 'pauses' || archiveListKind === 'echo';
  const rpcFilters: LibraryArchiveRpcFilters = options?.archiveRpcFilters ?? EMPTY_ARCHIVE_RPC_FILTERS;
  const rpcFilterKey = buildRpcFilterKey(options?.archiveRpcFilters);
  const itemsCacheKey = buildItemsCacheKey(
    archiveListKind,
    favoritesOnly,
    listSort,
    usesArchiveRpcList,
    rpcFilterKey,
  );
  const libraryItemsTable = libraryTableForKind(archiveListKind);

  // Initialize state from cache for instant render
  const [items, setItems] = useState<LibraryItem[]>(() => readCache<LibraryItem[]>(itemsCacheKey) ?? []);
  const [collections, setCollections] = useState<Collection[]>(() => readCache<Collection[]>(CACHE_KEY_COLLECTIONS) ?? []);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>(() => readCache<CollectionItem[]>(CACHE_KEY_COL_ITEMS) ?? []);
  const [loading, setLoading] = useState(true);
  /** True when the primary `library_items` page query failed (avoid false “empty library”). */
  const [listLoadFailed, setListLoadFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [readFlagsMap, setReadFlagsMap] = useState<Record<string, ReflectionReadFlags>>({});
  const [pauseInstanceArchiveMetaById, setPauseInstanceArchiveMetaById] = useState<
    Record<string, PauseInstanceArchiveMeta>
  >({});
  const [incompleteReflections, setIncompleteReflections] = useState<Set<string>>(new Set());
  const [reflectionOutcomes, setReflectionOutcomes] = useState<Record<string, string>>({});

  const hydratePauseMeta = useCallback(async (libItems: LibraryItem[]) => {
    const pauseInstanceIds = Array.from(
      new Set(libItems.map((i) => i.pause_instance_id).filter((x): x is string => !!x)),
    );
    if (pauseInstanceIds.length === 0) return;

    const [{ data: instRows }, { data: companionRows }] = await Promise.all([
      supabase
        .from('v_pause_full' as never)
        .select('id, state, engaged_at, outcome, has_breath_completed, counted_companion_types')
        .in('id', pauseInstanceIds),
      supabase
        .from('pause_companion_events' as never)
        .select('pause_instance_id, companion_type, action, counts_for_pause')
        .in('pause_instance_id', pauseInstanceIds)
        .eq('action', 'complete'),
    ]);

    const companionReadByInstance = new Map<string, Record<string, boolean>>();
    for (const c of (companionRows ?? []) as Array<{
      pause_instance_id: string;
      companion_type: string;
      counts_for_pause: boolean;
    }>) {
      const map = companionReadByInstance.get(c.pause_instance_id) ?? {};
      map[c.companion_type] = true;
      companionReadByInstance.set(c.pause_instance_id, map);
    }

    setReadFlagsMap((prev) => {
      const next = { ...prev };
      for (const r of ((instRows ?? []) as Array<{
        id: string;
        has_breath_completed: boolean;
        counted_companion_types: string[] | null;
      }>)) {
        const cMap = companionReadByInstance.get(r.id) ?? {};
        next[r.id] = {
          haiku_read: cMap['haiku'] ?? false,
          grounding_read: cMap['ground_nudge'] ?? false,
          signal_read: cMap['signal'] ?? false,
          zoom_out_read: cMap['zoom_out'] ?? cMap['zoom_out_deep_time'] ?? false,
          history_read: cMap['historical_insight'] ?? false,
        };
      }
      return next;
    });
    setPauseInstanceArchiveMetaById((prev) => {
      const next = { ...prev };
      for (const r of (instRows ?? []) as Array<{
        id: string;
        state: string;
        engaged_at: string | null;
        has_breath_completed: boolean;
        counted_companion_types: string[] | null;
      }>) {
        next[r.id] = {
          state: r.state,
          engaged_at: r.engaged_at ?? null,
          has_breath_completed: r.has_breath_completed,
          counted_companion_types: r.counted_companion_types,
        };
      }
      return next;
    });
    setIncompleteReflections((prev) => {
      const next = new Set(prev);
      for (const r of ((instRows ?? []) as Array<{ id: string; outcome: string | null }>)) {
        if (!r.outcome) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
    setReflectionOutcomes((prev) => {
      const next = { ...prev };
      for (const r of ((instRows ?? []) as Array<{ id: string; outcome: string | null }>)) {
        if (r.outcome) next[r.id] = r.outcome;
      }
      return next;
    });
  }, []);

  const prunePauseDerivedState = useCallback((libItems: LibraryItem[]) => {
    const keepPauseIds = new Set(
      libItems.map((i) => i.pause_instance_id).filter((x): x is string => !!x),
    );
    setReadFlagsMap((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!keepPauseIds.has(k)) delete next[k];
      }
      return next;
    });
    setPauseInstanceArchiveMetaById((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!keepPauseIds.has(k)) delete next[k];
      }
      return next;
    });
    setIncompleteReflections((prev) => {
      const next = new Set(prev);
      for (const id of [...next]) {
        if (!keepPauseIds.has(id)) next.delete(id);
      }
      return next;
    });
    setReflectionOutcomes((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!keepPauseIds.has(k)) delete next[k];
      }
      return next;
    });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setListLoadFailed(false);
      return;
    }
    // Swap list to this mode’s cache immediately so Pauses/Favs never briefly shows the wrong query’s rows.
    const cached = readCache<LibraryItem[]>(itemsCacheKey) ?? [];
    setItems(cached);
    setLoading(cached.length === 0);

    const searchTrim = rpcFilters.search?.trim() ?? '';
    const tagTrim = rpcFilters.tag?.trim() ?? '';
    const segment = archiveListKind === 'echo' ? 'echo' : 'pauses';
    const rpcPayload = {
      p_segment: segment,
      p_favorites_only: favoritesOnly,
      p_search: searchTrim === '' ? null : searchTrim,
      p_tag: tagTrim === '' ? null : tagTrim,
      p_source_types:
        segment === 'pauses' && rpcFilters.sourceTypes.length > 0 ? rpcFilters.sourceTypes : null,
      p_smart_ids: rpcFilters.smartIds.length > 0 ? rpcFilters.smartIds : null,
      p_sort: listSort,
      p_main_pause_only: segment === 'pauses' && rpcFilters.mainPauseBookmarkOnly,
      p_limit: PAGE_SIZE,
      p_offset: 0,
    } satisfies Database['public']['Functions']['library_archive_list_page']['Args'];

    const itemsPromise = usesArchiveRpcList
      ? supabase.rpc('library_archive_list_page', rpcPayload)
      : (() => {
          let itemsQuery = (supabase.from(libraryItemsTable as never) as ReturnType<typeof supabase.from>).select('*').eq('user_id', user.id);
          if (favoritesOnly) itemsQuery = itemsQuery.eq('is_favorite', true);
          if (listSort === 'alphabetical') {
            itemsQuery = itemsQuery
              .order('pinned', { ascending: false })
              .order('title', { ascending: true, nullsFirst: false });
          } else if (listSort === 'oldest') {
            itemsQuery = itemsQuery.order('pinned', { ascending: false }).order('created_at', { ascending: true });
          } else {
            itemsQuery = itemsQuery.order('pinned', { ascending: false }).order('created_at', { ascending: false });
          }
          return itemsQuery.range(0, PAGE_SIZE - 1);
        })();

    const [rItems, rCols, rColItems] = await Promise.all([
      itemsPromise,
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

    if (rItems.error) {
      setListLoadFailed(true);
      setLoading(false);
      return;
    }

    const libItems = (rItems.data as unknown as LibraryItem[]) ?? [];
    setItems(libItems);
    if (!rCols.error) {
      const cols = (rCols.data as unknown as Collection[]) ?? [];
      setCollections(cols);
      writeCache(CACHE_KEY_COLLECTIONS, cols);
    }
    if (!rColItems.error) {
      const colItems = (rColItems.data as unknown as CollectionItem[]) ?? [];
      setCollectionItems(colItems);
      writeCache(CACHE_KEY_COL_ITEMS, colItems);
    }
    if (rCols.error || rColItems.error) {
      toast.error(t('library.collectionsPartialLoadFailed'));
    }
    setHasMore(libItems.length === PAGE_SIZE);
    setListLoadFailed(false);
    setLoading(false);

    writeCache(itemsCacheKey, libItems);

    // Keep prior pause meta until hydration completes (avoids tab/list flicker).
    await hydratePauseMeta(libItems);
    prunePauseDerivedState(libItems);
  }, [
    user,
    hydratePauseMeta,
    t,
    favoritesOnly,
    itemsCacheKey,
    prunePauseDerivedState,
    libraryItemsTable,
    listSort,
    usesArchiveRpcList,
    archiveListKind,
    rpcFilters,
  ]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = items.length;

    const searchTrim = rpcFilters.search?.trim() ?? '';
    const tagTrim = rpcFilters.tag?.trim() ?? '';
    const segment = archiveListKind === 'echo' ? 'echo' : 'pauses';
    const rpcPayload = {
      p_segment: segment,
      p_favorites_only: favoritesOnly,
      p_search: searchTrim === '' ? null : searchTrim,
      p_tag: tagTrim === '' ? null : tagTrim,
      p_source_types:
        segment === 'pauses' && rpcFilters.sourceTypes.length > 0 ? rpcFilters.sourceTypes : null,
      p_smart_ids: rpcFilters.smartIds.length > 0 ? rpcFilters.smartIds : null,
      p_sort: listSort,
      p_main_pause_only: segment === 'pauses' && rpcFilters.mainPauseBookmarkOnly,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    } satisfies Database['public']['Functions']['library_archive_list_page']['Args'];

    const { data, error } = usesArchiveRpcList
      ? await supabase.rpc('library_archive_list_page', rpcPayload)
      : await (() => {
          let moreQuery = supabase.from(libraryItemsTable).select('*').eq('user_id', user.id);
          if (favoritesOnly) moreQuery = moreQuery.eq('is_favorite', true);
          if (listSort === 'alphabetical') {
            moreQuery = moreQuery
              .order('pinned', { ascending: false })
              .order('title', { ascending: true, nullsFirst: false });
          } else if (listSort === 'oldest') {
            moreQuery = moreQuery.order('pinned', { ascending: false }).order('created_at', { ascending: true });
          } else {
            moreQuery = moreQuery.order('pinned', { ascending: false }).order('created_at', { ascending: false });
          }
          return moreQuery.range(offset, offset + PAGE_SIZE - 1);
        })();
    if (error) {
      toast.error(t('library.loadMoreFailed'));
      setHasMore(false);
      setLoadingMore(false);
      return;
    }
    const newItems = (data as unknown as LibraryItem[]) ?? [];
    if (newItems.length > 0) {
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        const merged = [...prev, ...newItems.filter((i) => !seen.has(i.id))];
        writeCache(itemsCacheKey, merged);
        return merged;
      });
      await hydratePauseMeta(newItems);
    }
    setHasMore(newItems.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [
    user,
    loadingMore,
    hasMore,
    items.length,
    hydratePauseMeta,
    t,
    favoritesOnly,
    itemsCacheKey,
    libraryItemsTable,
    listSort,
    usesArchiveRpcList,
    archiveListKind,
    rpcFilters,
  ]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sync state to localStorage cache on every change
  useEffect(() => {
    if (items.length > 0) writeCache(itemsCacheKey, items);
  }, [items, itemsCacheKey]);
  useEffect(() => { writeCache(CACHE_KEY_COLLECTIONS, collections); }, [collections]);
  useEffect(() => { writeCache(CACHE_KEY_COL_ITEMS, collectionItems); }, [collectionItems]);

  // Library items CRUD
  const addItem = useCallback(async (item: Partial<LibraryItem>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('library_items')
      .insert({ ...item, user_id: user.id } as LibraryItemsInsert)
      .select()
      .single();
    if (error) return null;
    const newItem = data as unknown as LibraryItem;
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, [user]);

  const updateItem = useCallback(async (id: string, updates: LibraryItemsUpdate) => {
    await supabase.from('library_items').update(updates).eq('id', id);
    setItems((prev) => {
      const mapped = prev.map((i) => (i.id === id ? { ...i, ...updates } as LibraryItem : i));
      if (favoritesOnly && updates.is_favorite === false) {
        return mapped.filter((i) => i.id !== id);
      }
      return mapped;
    });
  }, [favoritesOnly]);

  const deleteItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.pause_instance_id && isMainPauseLibraryBookmark(item.source_type)) {
      // Deleting the main pause bookmark: soft-delete all library
      // items that share the pause_instance_id, then dismiss the
      // underlying pause.
      const pauseInstanceId = item.pause_instance_id;
      const siblingIds = items
        .filter((i) => i.pause_instance_id === pauseInstanceId)
        .map((i) => i.id);

      await supabase.from('library_items').update({ status: 'deleted' }).in('id', siblingIds);
      setItems((prev) =>
        prev.map((i) =>
          siblingIds.includes(i.id) ? { ...i, status: 'deleted' as const } : i,
        ),
      );
      setCollectionItems((prev) => prev.filter((ci) => !siblingIds.includes(ci.library_item_id)));

      // Dismiss the paired pause so the trigger clears its notification.
      try {
        await supabase.rpc('pause_dismiss_current' as never);
      } catch {
        /* non-fatal */
      }
    } else if (item.pause_instance_id) {
      // Deleting a companion item: soft-delete so backfill doesn't re-import
      await supabase.from('library_items').update({ status: 'deleted' }).eq('id', id);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'deleted' as const } : i));
      setCollectionItems((prev) => prev.filter((ci) => ci.library_item_id !== id));
    } else {
      // Standalone item: hard delete
      await supabase.from('library_items').delete().eq('id', id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCollectionItems((prev) => prev.filter((ci) => ci.library_item_id !== id));
    }
  }, [items]);

  const togglePin = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await updateItem(id, { pinned: !item.pinned });
  }, [items, updateItem]);

  const toggleFavorite = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await updateItem(id, { is_favorite: !item.is_favorite });
  }, [items, updateItem]);

  // Collections CRUD
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
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCollection = useCallback(async (id: string) => {
    await supabase.from('collections').delete().eq('id', id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setCollectionItems((prev) => prev.filter((ci) => ci.collection_id !== id));
  }, []);

  // Collection items
  const addToCollection = useCallback(async (collectionId: string, itemId: string) => {
    const exists = collectionItems.some((ci) => ci.collection_id === collectionId && ci.library_item_id === itemId);
    if (exists) return null;
    const maxPos = collectionItems
      .filter((ci) => ci.collection_id === collectionId)
      .reduce((max, ci) => Math.max(max, ci.position), -1);
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        library_item_id: itemId,
        position: maxPos + 1,
      } satisfies CollectionItemsInsert)
      .select()
      .single();
    if (error) return null;
    const newCI = data as unknown as CollectionItem;
    setCollectionItems((prev) => [...prev, newCI]);
    return newCI;
  }, [collectionItems]);

  const removeFromCollection = useCallback(async (collectionId: string, itemId: string) => {
    await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', collectionId)
      .eq('library_item_id', itemId);
    setCollectionItems((prev) => prev.filter((ci) => !(ci.collection_id === collectionId && ci.library_item_id === itemId)));
  }, []);

  const getCollectionItemIds = useCallback((collectionId: string) => {
    return collectionItems
      .filter((ci) => ci.collection_id === collectionId)
      .sort((a, b) => a.position - b.position)
      .map((ci) => ci.library_item_id);
  }, [collectionItems]);

  const getCollectionItemCount = useCallback((collectionId: string) => {
    return collectionItems.filter((ci) => ci.collection_id === collectionId).length;
  }, [collectionItems]);

  const getItemCollections = useCallback((itemId: string) => {
    const colIds = collectionItems.filter((ci) => ci.library_item_id === itemId).map((ci) => ci.collection_id);
    return collections.filter((c) => colIds.includes(c.id));
  }, [collectionItems, collections]);

  const getPauseArchiveMeta = useCallback(
    (pauseId: string | null) => (pauseId ? pauseInstanceArchiveMetaById[pauseId] : undefined),
    [pauseInstanceArchiveMetaById],
  );

  const isCompanionEngaged = useCallback((item: LibraryItem): boolean => {
    if (!item.pause_instance_id || !item.source_type) return true;
    const st = normalizeLibrarySourceType(item.source_type);
    if (st === 'pause' || st === 'pause_note') return true;
    const sourceToFlag: Record<string, keyof ReflectionReadFlags> = {
      haiku: 'haiku_read',
      grounding: 'grounding_read',
      signal: 'signal_read',
      zoom_out: 'zoom_out_read',
      history_insight: 'history_read',
    };
    const flagKey = sourceToFlag[item.source_type];
    if (!flagKey) return true;
    const flags = readFlagsMap[item.pause_instance_id];
    if (!flags) return false;
    return Boolean(flags[flagKey]);
  }, [readFlagsMap]);

  const isReflectionIncomplete = useCallback((item: LibraryItem): boolean => {
    if (!isMainPauseLibraryBookmark(item.source_type) || !item.pause_instance_id) return false;
    return incompleteReflections.has(item.pause_instance_id);
  }, [incompleteReflections]);

  const getReflectionOutcome = useCallback((item: LibraryItem): string | null => {
    if (!isMainPauseLibraryBookmark(item.source_type) || !item.pause_instance_id) return null;
    return reflectionOutcomes[item.pause_instance_id] ?? null;
  }, [reflectionOutcomes]);

  return {
    items, collections, collectionItems, loading, listLoadFailed,
    loadingMore, hasMore, loadMore,
    addItem, updateItem, deleteItem, togglePin, toggleFavorite,
    addCollection, updateCollection, deleteCollection,
    addToCollection, removeFromCollection,
    getCollectionItemIds, getCollectionItemCount, getItemCollections,
    isCompanionEngaged, isReflectionIncomplete, getReflectionOutcome,
    getPauseArchiveMeta,
    refetch: fetchAll,
  };
}

export function useSaveToLibrary() {
  const { user } = useAuth();

  const saveToLibrary = useCallback(async (params: {
    type: string;
    title?: string;
    body?: string;
    source_type?: string;
    source_url?: string;
    pause_instance_id?: string;
    tags?: string[];
  }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('library_items')
      .insert({ ...params, user_id: user.id } as LibraryItemsInsert)
      .select()
      .single();
    if (error) return null;
    return data as unknown as LibraryItem;
  }, [user]);

  return saveToLibrary;
}
