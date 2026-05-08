import { useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import {
  PAUSE_ARCHIVE_PAGE_SIZE,
  fetchPauseArchivePage,
  getPauseArchiveInfiniteQueryDefaults,
  pauseArchiveInfiniteQueryKey,
  pauseArchiveStorageCacheKey,
  type PauseArchiveListSort,
  type PauseArchiveRow,
  type PauseArchiveSegment,
} from '@/lib/pause-archive-list-query';

export type { PauseArchiveRow, PauseArchiveListSort, PauseArchiveSegment };
export { pauseArchiveListQueryPrefix } from '@/lib/pause-archive-list-query';

export type UsePauseArchiveListOptions = {
  segment: PauseArchiveSegment;
  favoritesOnly?: boolean;
  listSort?: PauseArchiveListSort;
  /** When false, skip network (e.g. Archive “Collections” tab uses another hook). */
  enabled?: boolean;
};

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

export function usePauseArchiveList(options: UsePauseArchiveListOptions) {
  const { user } = useAuth();
  const enabled = options.enabled ?? true;
  const segment = options.segment;
  const favoritesOnly = options.favoritesOnly ?? false;
  const listSort: PauseArchiveListSort = options.listSort ?? 'newest';
  const storageKey = pauseArchiveStorageCacheKey(segment, favoritesOnly, listSort);
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
    const page0 = cached.length > PAUSE_ARCHIVE_PAGE_SIZE ? cached.slice(0, PAUSE_ARCHIVE_PAGE_SIZE) : cached;
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
    queryFn: ({ pageParam }) =>
      fetchPauseArchivePage(userId!, segment, favoritesOnly, listSort, pageParam),
    ...getPauseArchiveInfiniteQueryDefaults(),
    enabled: queryEnabled,
    initialData,
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
    if (!queryEnabled) return;
    void refetch();
  }, [refetch, queryEnabled]);

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
