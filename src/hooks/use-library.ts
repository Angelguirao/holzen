import { useState, useEffect, useCallback } from 'react';
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
  grounding_read: boolean;
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

    // Targeted hydrate: only pull reflection fields we actually render in the UI,
    // scoped to the reflection_ids referenced by the loaded library items.
    // (Replaces the previous "fetch all reflections + all companions + backfill" loop
    //  which was the dominant source of Library load latency.)
    const reflectionIds = Array.from(
      new Set(libItems.map((i) => i.reflection_id).filter((x): x is string => !!x)),
    );
    if (reflectionIds.length === 0) {
      setReadFlagsMap({});
      setIncompleteReflections(new Set());
      setReflectionOutcomes({});
      return;
    }

    const [{ data: reflRows }, { data: companionRows }] = await Promise.all([
      supabase
        .from('reflections')
        .select('id, outcome, haiku_read, grounding_read')
        .in('id', reflectionIds),
      supabase
        .from('reflection_companions')
        .select('reflection_id, companion_type, read')
        .in('reflection_id', reflectionIds),
    ]);

    const companionReadByReflection = new Map<string, Record<string, boolean>>();
    for (const c of (companionRows ?? []) as any[]) {
      const map = companionReadByReflection.get(c.reflection_id) ?? {};
      map[c.companion_type] = c.read ?? false;
      companionReadByReflection.set(c.reflection_id, map);
    }

    const flags: Record<string, ReflectionReadFlags> = {};
    const incomplete = new Set<string>();
    const outcomes: Record<string, string> = {};
    for (const r of (reflRows ?? []) as any[]) {
      const cMap = companionReadByReflection.get(r.id) ?? {};
      flags[r.id] = {
        haiku_read: !!r.haiku_read,
        grounding_read: cMap['ground_nudge'] ?? !!r.grounding_read,
        signal_read: cMap['signal'] ?? false,
        zoom_out_read: cMap['zoom_out'] ?? cMap['zoom_out_deep_time'] ?? false,
        history_read: cMap['historical_insight'] ?? false,
      };
      if (!r.outcome) incomplete.add(r.id);
      if (r.outcome) outcomes[r.id] = r.outcome;
    }
    setReadFlagsMap(flags);
    setIncompleteReflections(incomplete);
    setReflectionOutcomes(outcomes);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Sync state to localStorage cache on every change
  useEffect(() => { if (items.length > 0) writeCache(CACHE_KEY_ITEMS, items); }, [items]);
  useEffect(() => { writeCache(CACHE_KEY_COLLECTIONS, collections); }, [collections]);
  useEffect(() => { writeCache(CACHE_KEY_COL_ITEMS, collectionItems); }, [collectionItems]);

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
      grounding: 'grounding_read',
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
