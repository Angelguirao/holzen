import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface LibraryItem {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  source_type: string | null;
  source_url: string | null;
  reflection_id: string | null;
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
  learning_read: boolean;
  signal_read: boolean;
  zoom_out_read: boolean;
  history_read: boolean;
}

const CACHE_KEY_ITEMS = 'holzen_library_items';
const CACHE_KEY_COLLECTIONS = 'holzen_library_collections';
const CACHE_KEY_COL_ITEMS = 'holzen_library_col_items';

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function useLibrary() {
  const { user } = useAuth();

  // Initialize state from cache for instant render
  const [items, setItems] = useState<LibraryItem[]>(() => readCache<LibraryItem[]>(CACHE_KEY_ITEMS) ?? []);
  const [collections, setCollections] = useState<Collection[]>(() => readCache<Collection[]>(CACHE_KEY_COLLECTIONS) ?? []);
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>(() => readCache<CollectionItem[]>(CACHE_KEY_COL_ITEMS) ?? []);
  const [loading, setLoading] = useState(true);
  const [readFlagsMap, setReadFlagsMap] = useState<Record<string, ReflectionReadFlags>>({});
  const [incompleteReflections, setIncompleteReflections] = useState<Set<string>>(new Set());
  const [reflectionOutcomes, setReflectionOutcomes] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: itemsData }, { data: collectionsData }, { data: colItemsData }] = await Promise.all([
      supabase
        .from('library_items')
        .select('*')
        .eq('user_id', user.id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
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
    const libItems = (itemsData as unknown as LibraryItem[]) ?? [];
    const cols = (collectionsData as unknown as Collection[]) ?? [];
    const colItems = (colItemsData as unknown as CollectionItem[]) ?? [];
    setItems(libItems);
    setCollections(cols);
    setCollectionItems(colItems);
    setLoading(false);

    // Persist to cache for offline-first reads
    writeCache(CACHE_KEY_ITEMS, libItems);
    writeCache(CACHE_KEY_COLLECTIONS, cols);
    writeCache(CACHE_KEY_COL_ITEMS, colItems);

    // Backfill: import reflections and their companions not yet in library (runs every load)
    const existingKeys = new Set(
      libItems.filter((i) => i.reflection_id).map((i) => `${i.reflection_id}:${i.source_type}`)
    );
    const { data: allReflections } = await supabase
      .from('reflections')
      .select('id, message, context, created_at, outcome, haiku, learning_title, learning_body, learning_url, signal_title, signal_body, signal_source, signal_url, zoom_out_data, history_insight_data, haiku_read, learning_read, signal_read, zoom_out_read, history_read')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (allReflections && allReflections.length > 0) {
      // Build read flags map and incomplete set
      const flags: Record<string, ReflectionReadFlags> = {};
      const incomplete = new Set<string>();
      const outcomes: Record<string, string> = {};
      for (const r of allReflections as any[]) {
        flags[r.id] = {
          haiku_read: !!r.haiku_read,
          learning_read: !!r.learning_read,
          signal_read: !!r.signal_read,
          zoom_out_read: !!r.zoom_out_read,
          history_read: !!r.history_read,
        };
        if (!r.outcome) incomplete.add(r.id);
        if (r.outcome) outcomes[r.id] = r.outcome;
      }
      setReadFlagsMap(flags);
      setIncompleteReflections(incomplete);
      setReflectionOutcomes(outcomes);

      const inserts: any[] = [];
      for (const r of allReflections as any[]) {
        if (!existingKeys.has(`${r.id}:reflection`)) {
          inserts.push({ user_id: user.id, type: 'bookmark', title: 'Reflection', body: r.message, source_type: 'reflection', reflection_id: r.id, tags: ['reflection'], created_at: r.created_at, status: 'read' });
        }
        if (r.haiku && !existingKeys.has(`${r.id}:haiku`)) {
          inserts.push({ user_id: user.id, type: 'bookmark', title: 'Haiku', body: r.haiku, source_type: 'haiku', reflection_id: r.id, tags: [], created_at: r.created_at, status: r.haiku_read ? 'read' : 'unread' });
        }
        if (r.signal_source && !existingKeys.has(`${r.id}:signal`)) {
          inserts.push({ user_id: user.id, type: 'bookmark', title: r.signal_title, body: r.signal_body, source_type: 'signal', source_url: r.signal_url, reflection_id: r.id, tags: [], created_at: r.created_at, status: r.signal_read ? 'read' : 'unread' });
        }
        if (r.learning_title && !existingKeys.has(`${r.id}:learning`)) {
          inserts.push({ user_id: user.id, type: 'bookmark', title: r.learning_title, body: r.learning_body, source_type: 'learning', source_url: r.learning_url, reflection_id: r.id, tags: [], created_at: r.created_at, status: r.learning_read ? 'read' : 'unread' });
        }
        if (r.zoom_out_data && !existingKeys.has(`${r.id}:zoom_out`)) {
          const zd = r.zoom_out_data as any;
          const zoomBody = zd?.deepTime?.body || zd?.echo?.message || zd?.deepTime?.title || (typeof zd === 'object' ? JSON.stringify(zd) : String(zd));
          inserts.push({ user_id: user.id, type: 'bookmark', title: zd?.deepTime?.title || 'Zoom Out', body: zoomBody, source_type: 'zoom_out', reflection_id: r.id, tags: [], created_at: r.created_at, status: r.zoom_out_read ? 'read' : 'unread' });
        }
        if (r.history_insight_data && !existingKeys.has(`${r.id}:history_insight`)) {
          const hd = r.history_insight_data as any;
          inserts.push({ user_id: user.id, type: 'bookmark', title: hd.title ?? 'History Insight', body: hd.btcInsight ?? '', source_type: 'history_insight', reflection_id: r.id, tags: [], created_at: r.created_at, status: r.history_read ? 'read' : 'unread' });
        }
      }
      if (inserts.length > 0) {
        // Retry logic: attempt batch insert, on failure try individual inserts
        const tryInsert = async (items: any[], retries = 2): Promise<void> => {
          const { error: batchErr } = await supabase.from('library_items').insert(items);
          if (!batchErr) return;
          
          console.warn(`[library backfill] batch insert failed (${items.length} items): ${batchErr.message}`);
          
          if (retries > 0) {
            // Wait briefly then retry the whole batch
            await new Promise((r) => setTimeout(r, 1000));
            const { error: retryErr } = await supabase.from('library_items').insert(items);
            if (!retryErr) return;
            console.warn(`[library backfill] batch retry failed: ${retryErr.message}`);
          }

          // Fall back to individual inserts so partial failures don't lose everything
          let failed = 0;
          for (const item of items) {
            const { error: singleErr } = await supabase.from('library_items').insert(item);
            if (singleErr) {
              // Skip duplicates silently (unique constraint), log others
              if (!singleErr.message.includes('duplicate') && !singleErr.message.includes('unique')) {
                failed++;
                console.error(`[library backfill] single insert failed (${item.source_type}/${item.reflection_id}):`, singleErr.message);
              }
            }
          }
          if (failed > 0) {
            // Store failed count in localStorage so we can retry on next load
            const retryKey = `holzen_backfill_retry_${user!.id}`;
            const prev = parseInt(localStorage.getItem(retryKey) ?? '0', 10);
            localStorage.setItem(retryKey, String(prev + failed));
            console.warn(`[library backfill] ${failed} items failed, queued for next load`);
          }
        };

        await tryInsert(inserts);
        const { data: refreshed } = await supabase
          .from('library_items')
          .select('*')
          .eq('user_id', user.id)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false });
        if (refreshed) setItems(refreshed as unknown as LibraryItem[]);
      }
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Library items CRUD
  const addItem = useCallback(async (item: Partial<LibraryItem>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('library_items')
      .insert({ ...item, user_id: user.id } as any)
      .select()
      .single();
    if (error) return null;
    const newItem = data as unknown as LibraryItem;
    setItems((prev) => [newItem, ...prev]);
    return newItem;
  }, [user]);

  const updateItem = useCallback(async (id: string, updates: Partial<LibraryItem>) => {
    await supabase.from('library_items').update(updates as any).eq('id', id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (item.reflection_id && item.source_type === 'reflection') {
      // Deleting a reflection: soft-delete ALL library items sharing this reflection_id,
      // then delete the underlying reflection record so it disappears from Home too.
      const reflectionId = item.reflection_id;
      const siblingIds = items.filter((i) => i.reflection_id === reflectionId).map((i) => i.id);

      await supabase.from('library_items').update({ status: 'deleted' } as any).in('id', siblingIds);
      setItems((prev) => prev.map((i) => siblingIds.includes(i.id) ? { ...i, status: 'deleted' as const } : i));
      setCollectionItems((prev) => prev.filter((ci) => !siblingIds.includes(ci.library_item_id)));

      // Delete the actual reflection
      await supabase.from('reflections').delete().eq('id', reflectionId);

      // Clear active pause if it matches this reflection
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('last_message').eq('user_id', user.id).single();
        if (profile?.last_message === item.body) {
          await supabase.rpc('update_profile_safe', {
            _user_id: user.id,
            _updates: { last_message: null, last_context: null },
          });
        }
      }
    } else if (item.reflection_id) {
      // Deleting a companion item: soft-delete so backfill doesn't re-import
      await supabase.from('library_items').update({ status: 'deleted' } as any).eq('id', id);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: 'deleted' as const } : i));
      setCollectionItems((prev) => prev.filter((ci) => ci.library_item_id !== id));
    } else {
      // Standalone item: hard delete
      await supabase.from('library_items').delete().eq('id', id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCollectionItems((prev) => prev.filter((ci) => ci.library_item_id !== id));
    }
  }, [items, user]);

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
      .insert({ ...col, user_id: user.id } as any)
      .select()
      .single();
    if (error) return null;
    const newCol = data as unknown as Collection;
    setCollections((prev) => [newCol, ...prev]);
    return newCol;
  }, [user]);

  const updateCollection = useCallback(async (id: string, updates: Partial<Collection>) => {
    await supabase.from('collections').update(updates as any).eq('id', id);
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
      .insert({ collection_id: collectionId, library_item_id: itemId, position: maxPos + 1 } as any)
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

  const isCompanionEngaged = useCallback((item: LibraryItem): boolean => {
    if (!item.reflection_id || !item.source_type) return true;
    if (item.source_type === 'reflection' || item.source_type === 'reflection_note') return true;
    const flags = readFlagsMap[item.reflection_id];
    if (!flags) return true; // no data, assume engaged
    const sourceToFlag: Record<string, keyof ReflectionReadFlags> = {
      haiku: 'haiku_read',
      learning: 'learning_read',
      signal: 'signal_read',
      zoom_out: 'zoom_out_read',
      history_insight: 'history_read',
    };
    const flagKey = sourceToFlag[item.source_type];
    return flagKey ? flags[flagKey] : true;
  }, [readFlagsMap]);

  const isReflectionIncomplete = useCallback((item: LibraryItem): boolean => {
    if (item.source_type !== 'reflection' || !item.reflection_id) return false;
    return incompleteReflections.has(item.reflection_id);
  }, [incompleteReflections]);

  const getReflectionOutcome = useCallback((item: LibraryItem): string | null => {
    if (item.source_type !== 'reflection' || !item.reflection_id) return null;
    return reflectionOutcomes[item.reflection_id] ?? null;
  }, [reflectionOutcomes]);

  return {
    items, collections, collectionItems, loading,
    addItem, updateItem, deleteItem, togglePin, toggleFavorite,
    addCollection, updateCollection, deleteCollection,
    addToCollection, removeFromCollection,
    getCollectionItemIds, getCollectionItemCount, getItemCollections,
    isCompanionEngaged, isReflectionIncomplete, getReflectionOutcome,
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
    reflection_id?: string;
    tags?: string[];
  }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('library_items')
      .insert({ ...params, user_id: user.id } as any)
      .select()
      .single();
    if (error) return null;
    return data as unknown as LibraryItem;
  }, [user]);

  return saveToLibrary;
}
