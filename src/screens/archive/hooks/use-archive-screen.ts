import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getArchivePausesTabHasRowsQueryOptions,
  usePauseArchiveList,
  type PauseArchiveRow,
  type PauseArchiveSegment,
  type ArchiveMainSegment,
} from '@/features/pause/public-hooks';
import { useInfiniteScroll } from '@/app/hooks/use-infinite-scroll';
import { usePullToRefresh } from '@/app/hooks/use-pull-to-refresh';
import { useAuth } from '@/features/auth/public';
import {
  collectArchiveTags,
  filterAndSortArchiveRows,
} from '@/screens/archive/lib/archive-list-filter';
import {
  readArchiveMainSegment,
  readArchivePausesScope,
  type ArchiveSortMode,
} from '@/screens/archive/lib/archive-screen-params';

/**
 * Archive tab conductor — URL segments, list query, client filters, pull-to-refresh.
 */
export function useArchiveScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainSegment = useMemo(() => readArchiveMainSegment(searchParams), [searchParams]);
  const pausesScope = useMemo(() => readArchivePausesScope(searchParams), [searchParams]);
  const libraryListFavoritesOnly = mainSegment === 'pauses' && pausesScope === 'favorites';

  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<ArchiveSortMode>('newest');

  const pauseSeg: PauseArchiveSegment = mainSegment === 'echoes' ? 'echoes' : 'pauses';
  const pauseArchive = usePauseArchiveList({
    segment: pauseSeg,
    favoritesOnly: mainSegment === 'pauses' ? libraryListFavoritesOnly : false,
    listSort: sortMode,
    enabled: mainSegment === 'pauses' || mainSegment === 'echoes',
  });
  const [pausesArchiveCountNonce, setPausesArchiveCountNonce] = useState(0);

  const pausesArchiveCountQuery = useQuery(
    getArchivePausesTabHasRowsQueryOptions({
      userId: user?.id,
      nonce: pausesArchiveCountNonce,
      enabled: Boolean(user?.id && mainSegment === 'pauses'),
    }),
  );

  const pausesTabHasArchiveRows = useMemo((): boolean | null => {
    if (mainSegment !== 'pauses') return false;
    if (!user?.id) return null;
    if (pausesArchiveCountQuery.isPending) return null;
    if (pausesArchiveCountQuery.isError) return null;
    return pausesArchiveCountQuery.data ?? null;
  }, [mainSegment, user?.id, pausesArchiveCountQuery.isPending, pausesArchiveCountQuery.isError, pausesArchiveCountQuery.data]);

  const hasActiveFilters = !!tagFilter || !!search.trim();

  const setMainSegment = useCallback(
    (seg: ArchiveMainSegment) => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (seg === 'pauses') n.delete('seg');
          else n.set('seg', seg);
          if (seg !== 'pauses') n.delete('scope');
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setPausesScope = useCallback(
    (scope: 'all' | 'favorites') => {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          if (scope === 'favorites') n.set('scope', 'favs');
          else n.delete('scope');
          return n;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (searchParams.get('seg') === 'collections') {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete('seg');
          return n;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (mainSegment !== 'pauses' && pausesScope === 'favorites') {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete('scope');
          return n;
        },
        { replace: true },
      );
    }
  }, [mainSegment, pausesScope, setSearchParams]);

  const handleRefresh = useCallback(async () => {
    if (mainSegment === 'pauses' || mainSegment === 'echoes') {
      setPausesArchiveCountNonce((n) => n + 1);
    }
    await pauseArchive.refetch();
  }, [pauseArchive, mainSegment]);

  const { pullDistance, refreshing, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 70,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: pauseArchive.hasMore,
    loading: pauseArchive.loadingMore,
    onLoadMore: pauseArchive.loadMore,
    rootMargin: mainSegment === 'echoes' ? '80px' : '200px',
  });

  const rows = pauseArchive.rows;

  const segmentBase = useMemo(() => {
    if (mainSegment !== 'pauses' && mainSegment !== 'echoes') return [];
    return rows.filter((r) => !!r.id);
  }, [rows, mainSegment]);

  const availableTags = useMemo(() => collectArchiveTags(segmentBase), [segmentBase]);

  const filtered = useMemo(
    () => filterAndSortArchiveRows(segmentBase, { tagFilter, search, sortMode }),
    [segmentBase, tagFilter, search, sortMode],
  );

  const hasAnyPauseArchiveContent = useMemo(() => {
    if (mainSegment !== 'pauses') return false;
    return pausesTabHasArchiveRows ?? segmentBase.length > 0;
  }, [mainSegment, pausesTabHasArchiveRows, segmentBase.length]);

  const hasAnyEchoesContent = useMemo(() => {
    if (mainSegment !== 'echoes') return false;
    return rows.length > 0;
  }, [mainSegment, rows.length]);

  const emptyLibraryItemsProps = useMemo(() => {
    if (mainSegment === 'echoes') {
      if (!hasAnyEchoesContent) {
        return {
          emptyStateMessage: t('archive.emptyEchoesNone'),
          emptyStateHint: '',
          emptyCtaLabel: undefined as string | undefined,
          emptyCtaTo: undefined as string | undefined,
        };
      }
    }
    if (mainSegment === 'pauses') {
      if (!hasAnyPauseArchiveContent && pausesScope === 'all' && !hasActiveFilters) {
        return {
          emptyStateMessage: t('archive.emptyPauseFirst'),
          emptyStateHint: '',
          emptyCtaLabel: t('archive.emptyPauseFirstCta'),
          emptyCtaTo: '/pause',
        };
      }
      if (pausesScope === 'favorites' && filtered.length === 0 && hasAnyPauseArchiveContent) {
        return {
          emptyStateMessage: t('archive.emptyFavs'),
          emptyStateHint: '',
          emptyCtaLabel: undefined as string | undefined,
          emptyCtaTo: undefined as string | undefined,
        };
      }
    }
    if (hasActiveFilters && filtered.length === 0) {
      return {
        emptyStateMessage: t('archive.noResults'),
        emptyStateHint: '',
        emptyCtaLabel: undefined as string | undefined,
        emptyCtaTo: undefined as string | undefined,
      };
    }
    return {
      emptyStateMessage: undefined as string | undefined,
      emptyStateHint: undefined as string | undefined,
      emptyCtaLabel: undefined as string | undefined,
      emptyCtaTo: undefined as string | undefined,
    };
  }, [
    mainSegment,
    hasAnyEchoesContent,
    hasAnyPauseArchiveContent,
    pausesScope,
    hasActiveFilters,
    filtered.length,
    t,
  ]);

  const cycleSortMode = useCallback(() => {
    setSortMode((prev) =>
      prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'alphabetical' : 'newest',
    );
  }, []);

  const sortLabel =
    sortMode === 'newest'
      ? t('library.sortNewest', { defaultValue: 'Newest' })
      : sortMode === 'oldest'
        ? t('library.sortOldest', { defaultValue: 'Oldest' })
        : t('library.sortAlpha', { defaultValue: 'A–Z' });

  const clearAllFilters = useCallback(() => {
    setTagFilter(null);
    setSearch('');
  }, []);

  return {
    t,
    mainSegment,
    pausesScope,
    setMainSegment,
    setPausesScope,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    hasActiveFilters,
    clearAllFilters,
    sortLabel,
    cycleSortMode,
    pauseArchive,
    pullDistance,
    refreshing,
    pullHandlers: handlers,
    loadMoreRef,
    rows,
    filtered,
    availableTags,
    emptyLibraryItemsProps,
  };
}
