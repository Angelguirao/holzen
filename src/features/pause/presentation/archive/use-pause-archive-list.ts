import { useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/public';
import {
  buildPauseArchiveInfiniteInitialData,
  isPauseArchiveListInitialLoading,
} from '@/features/pause/application/use-cases/archive/pause-archive-list-ui-state';
import {
  readJsonLocalStorage,
  writeJsonLocalStorage,
} from '@/features/pause/infrastructure/json-local-storage';
import {
  PAUSE_ARCHIVE_PAGE_SIZE,
  fetchPauseArchivePage,
  getPauseArchiveInfiniteQueryDefaults,
  pauseArchiveInfiniteQueryKey,
  pauseArchiveStorageCacheKey,
  type PauseArchiveListSort,
  type PauseArchiveRow,
  type PauseArchiveSegment,
} from '../../public-queries';

export type { PauseArchiveRow, PauseArchiveListSort, PauseArchiveSegment };

export type UsePauseArchiveListOptions = {
  segment: PauseArchiveSegment;
  favoritesOnly?: boolean;
  listSort?: PauseArchiveListSort;
  /** When false, skip network (e.g. Archive “Collections” tab uses another hook). */
  enabled?: boolean;
};

/** Infinite pause/echo archive lists (`v_pause_archive_*`) with optional localStorage seed. */
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

  const initialData = useMemo(() => {
    if (!queryEnabled || !userId) return undefined;
    const cached = readJsonLocalStorage<PauseArchiveRow[]>(storageKey);
    return buildPauseArchiveInfiniteInitialData(cached, PAUSE_ARCHIVE_PAGE_SIZE);
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

  const loading = isPauseArchiveListInitialLoading({
    queryEnabled,
    isError,
    rowCount: rows.length,
    isPending,
    isFetching,
  });
  const listLoadFailed = queryEnabled && isError;
  const loadingMore = isFetchingNextPage;
  const hasMore = Boolean(hasNextPage);

  useEffect(() => {
    if (enabled && rows.length > 0) writeJsonLocalStorage(storageKey, rows);
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

  const refetchAll = useCallback(async (): Promise<void> => {
    if (!queryEnabled) return;
    await refetch();
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
