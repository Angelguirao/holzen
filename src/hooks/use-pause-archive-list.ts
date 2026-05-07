import { useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
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

/** Prefix for TanStack invalidation when pause lifecycle bumps archive-related caches. */
export function pauseArchiveListQueryPrefix(userId: string) {
  return ['pause-archive', userId] as const;
}

function pauseArchiveInfiniteQueryKey(
  userId: string,
  segment: PauseArchiveSegment,
  favoritesOnly: boolean,
  listSort: PauseArchiveListSort,
) {
  return [...pauseArchiveListQueryPrefix(userId), segment, favoritesOnly ? 'fav' : 'all', listSort] as const;
}

async function fetchArchivePage(
  userId: string,
  table: (typeof TABLE)[PauseArchiveSegment],
  favoritesOnly: boolean,
  listSort: PauseArchiveListSort,
  offset: number,
): Promise<PauseArchiveRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = (supabase as any).from(table).select('*').eq('user_id', userId);
  if (favoritesOnly) q = q.eq('is_favorite', true);
  if (listSort === 'alphabetical') {
    q = q.order('source', { ascending: true, nullsFirst: false }).order('terminal_at', { ascending: false, nullsFirst: false });
  } else if (listSort === 'oldest') {
    q = q.order('terminal_at', { ascending: true, nullsFirst: false }).order('created_at', { ascending: true });
  } else {
    q = q.order('terminal_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
  }
  const { data, error } = await q.range(offset, offset + PAGE_SIZE - 1);
  if (error) throw error;
  return (data as PauseArchiveRow[]) ?? [];
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
  const storageKey = cacheKey(segment, favoritesOnly, listSort);
  const table = TABLE[segment];
  const userId = user?.id;
  const queryEnabled = enabled && Boolean(userId);

  const queryKey = useMemo(() => {
    if (!userId) return ['pause-archive', 'signed-out', segment, favoritesOnly ? 'fav' : 'all', listSort] as const;
    if (!enabled) return ['pause-archive', userId, 'paused', segment, favoritesOnly ? 'fav' : 'all', listSort] as const;
    return pauseArchiveInfiniteQueryKey(userId, segment, favoritesOnly, listSort);
  }, [userId, enabled, segment, favoritesOnly, listSort]);

  const initialData = useMemo((): InfiniteData<PauseArchiveRow[], number> | undefined => {
    if (!queryEnabled || !userId) return undefined;
    const cached = readCache(storageKey);
    if (!cached?.length) return undefined;
    const page0 = cached.length > PAGE_SIZE ? cached.slice(0, PAGE_SIZE) : cached;
    return { pages: [page0], pageParams: [0] };
  }, [queryEnabled, userId, storageKey]);

  const {
    data,
    isPending,
    isFetching,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => fetchArchivePage(userId!, table, favoritesOnly, listSort, pageParam),
    enabled: queryEnabled,
    initialData,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((sum, p) => sum + p.length, 0);
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const rows = useMemo((): PauseArchiveRow[] => {
    if (!queryEnabled) return [];
    return data?.pages.flat() ?? [];
  }, [queryEnabled, data]);

  const loading = queryEnabled && !isError && rows.length === 0 && (isPending || isFetching);
  const listLoadFailed = queryEnabled && isError;
  const loadingMore = isFetchingNextPage;
  const hasMore = Boolean(hasNextPage);

  useEffect(() => {
    if (enabled && rows.length > 0) writeCache(storageKey, rows);
  }, [rows, storageKey, enabled]);

  const loadMore = useCallback(async () => {
    if (!queryEnabled || isFetchingNextPage || !hasNextPage) return;
    try {
      const result = await fetchNextPage();
      if (result.isError) toast.error('Could not load more');
    } catch {
      toast.error('Could not load more');
    }
  }, [queryEnabled, isFetchingNextPage, hasNextPage, fetchNextPage]);

  const refetchAll = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    rows,
    loading,
    listLoadFailed,
    loadingMore,
    hasMore,
    loadMore,
    refetch: refetchAll,
  };
}
