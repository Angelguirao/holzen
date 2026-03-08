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
  status: 'unread' | 'read' | 'archived';
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
  item_count?: number;
}

export function useLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: itemsData }, { data: collectionsData }] = await Promise.all([
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
    ]);
    setItems((itemsData as unknown as LibraryItem[]) ?? []);
    setCollections((collectionsData as unknown as Collection[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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
    await supabase.from('library_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await updateItem(id, { pinned: !item.pinned });
  }, [items, updateItem]);

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

  const deleteCollection = useCallback(async (id: string) => {
    await supabase.from('collections').delete().eq('id', id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return {
    items, collections, loading,
    addItem, updateItem, deleteItem, togglePin,
    addCollection, deleteCollection, refetch: fetchAll,
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
