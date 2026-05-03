import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { Database } from '@/integrations/supabase/types';

export type PauseArchiveSegment = 'pauses' | 'echoes';

export type PauseArchiveListSort = 'newest' | 'oldest' | 'alphabetical';

/** Archive list views and collection members both expose `v_pause_full`-shaped rows. */
export type PauseArchiveRow = Database['public']['Views']['v_pause_full']['Row'];

const PAGE_SIZE = 50;

const TABLE: Record<PauseArchiveSegment, 'v_pause_archive_pauses' | 'v_pause_archive_echoes'> = {
  pauses: 'v_pause_archive_pauses',
  echoes: 'v_pause_archive_echoes',
};

function cacheKey(segment: PauseArchiveSegment, favoritesOnly: boolean, sort: PauseArchiveListSort) {
  return `holzen_pause_archive:${segment}:${favoritesOnly ? 'fav' : 'all'}:${sort}`;
}

function readCache(key: string): PauseArchiveRow[] | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PauseArchiveRow[]) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: PauseArchiveRow[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export type UsePauseArchiveListOptions = {
  segment: PauseArchiveSegment;
  favoritesOnly?: boolean;
  listSort?: PauseArchiveListSort;
  /** When false, skip network (e.g. Archive “Collections” tab uses another hook). */
  enabled?: boolean;
};

export function usePauseArchiveList(options: UsePauseArchiveListOptions) {
  const { user } = useAuth();
  const enabled = options.enabled ?? true;
  const segment = options.segment;
  const favoritesOnly = options.favoritesOnly ?? false;
  const listSort: PauseArchiveListSort = options.listSort ?? 'newest';
  const key = cacheKey(segment, favoritesOnly, listSort);
  const table = TABLE[segment];

  const [rows, setRows] = useState<PauseArchiveRow[]>(() => (enabled ? readCache(key) ?? [] : []));
  const [loading, setLoading] = useState(true);
  const [listLoadFailed, setListLoadFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = useCallback(
    async (offset: number) => {
      if (!enabled || !user) return { data: [] as PauseArchiveRow[], error: null };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any).from(table).select('*').eq('user_id', user.id);
      if (favoritesOnly) q = q.eq('is_favorite', true);
      if (listSort === 'alphabetical') {
        q = q.order('source', { ascending: true, nullsFirst: false }).order('terminal_at', { ascending: false, nullsFirst: false });
      } else if (listSort === 'oldest') {
        q = q.order('terminal_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
      } else {
        q = q.order('terminal_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
      }
      return q.range(offset, offset + PAGE_SIZE - 1);
    },
    [user, table, favoritesOnly, listSort, enabled],
  );

  const fetchAll = useCallback(async () => {
    if (!enabled) {
      setRows([]);
      setLoading(false);
      setListLoadFailed(false);
      setHasMore(false);
      return;
    }
    if (!user) {
      setLoading(false);
      setListLoadFailed(false);
      return;
    }
    const cached = readCache(key) ?? [];
    const optimistic = cached.length > PAGE_SIZE ? cached.slice(0, PAGE_SIZE) : cached;
    setRows(optimistic);
    setLoading(optimistic.length === 0);

    const { data, error } = await fetchPage(0);
    if (error) {
      setListLoadFailed(true);
      setLoading(false);
      return;
    }
    const next = (data as PauseArchiveRow[]) ?? [];
    setRows(next);
    setHasMore(next.length === PAGE_SIZE);
    setListLoadFailed(false);
    setLoading(false);
    writeCache(key, next);
  }, [user, fetchPage, key, enabled]);

  const loadMore = useCallback(async () => {
    if (!enabled || !user || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const offset = rows.length;
    const { data, error } = await fetchPage(offset);
    if (error) {
      toast.error('Could not load more');
      setHasMore(false);
      setLoadingMore(false);
      return;
    }
    const batch = (data as PauseArchiveRow[]) ?? [];
    if (batch.length > 0) {
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.id).filter(Boolean) as string[]);
        const merged = [...prev, ...batch.filter((r) => r.id && !seen.has(r.id))];
        writeCache(key, merged);
        return merged;
      });
    }
    setHasMore(batch.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [enabled, user, loadingMore, hasMore, rows.length, fetchPage, key]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (enabled && rows.length > 0) writeCache(key, rows);
  }, [rows, key, enabled]);

  return {
    rows,
    loading,
    listLoadFailed,
    loadingMore,
    hasMore,
    loadMore,
    refetch: fetchAll,
  };
}
