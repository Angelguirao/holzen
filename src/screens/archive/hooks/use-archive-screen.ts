import { useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  usePauseArchiveList,
  type PauseArchiveRow,
  type PauseArchiveSegment,
  type ArchiveMainSegment,
} from '@/features/pause/public-hooks';
import { useInfiniteScroll } from '@/app/hooks/use-infinite-scroll';
import { usePullToRefresh } from '@/app/hooks/use-pull-to-refresh';
import {
  readArchiveMainSegment,
  readArchivePausesScope,
} from '@/screens/archive/lib/archive-screen-params';

/**
 * Archive tab conductor — URL segments, list query, pull-to-refresh.
 */
export function useArchiveScreen() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainSegment = useMemo(() => readArchiveMainSegment(searchParams), [searchParams]);
  const pausesScope = useMemo(() => readArchivePausesScope(searchParams), [searchParams]);
  const libraryListFavoritesOnly = mainSegment === 'pauses' && pausesScope === 'favorites';

  const pauseSeg: PauseArchiveSegment = mainSegment === 'echoes' ? 'echoes' : 'pauses';
  const pauseArchive = usePauseArchiveList({
    segment: pauseSeg,
    favoritesOnly: mainSegment === 'pauses' ? libraryListFavoritesOnly : false,
    enabled: mainSegment === 'pauses' || mainSegment === 'echoes',
  });

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
    await pauseArchive.refetch();
  }, [pauseArchive]);

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

  const items = useMemo((): PauseArchiveRow[] => {
    if (mainSegment !== 'pauses' && mainSegment !== 'echoes') return [];
    return rows.filter((r) => !!r.id);
  }, [rows, mainSegment]);

  const hasAnyPauseArchiveContent = useMemo(() => {
    if (mainSegment !== 'pauses') return false;
    return items.length > 0 || pauseArchive.hasMore;
  }, [mainSegment, items.length, pauseArchive.hasMore]);

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
      if (!pauseArchive.loading && !hasAnyPauseArchiveContent && pausesScope === 'all') {
        return {
          emptyStateMessage: t('archive.emptyPauseFirst'),
          emptyStateHint: '',
          emptyCtaLabel: t('archive.emptyPauseFirstCta'),
          emptyCtaTo: '/pause',
        };
      }
      if (!pauseArchive.loading && pausesScope === 'favorites' && items.length === 0) {
        return {
          emptyStateMessage: t('archive.emptyFavs'),
          emptyStateHint: '',
          emptyCtaLabel: undefined as string | undefined,
          emptyCtaTo: undefined as string | undefined,
        };
      }
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
    items.length,
    pauseArchive.loading,
    t,
  ]);

  return {
    t,
    mainSegment,
    pausesScope,
    setMainSegment,
    setPausesScope,
    pauseArchive,
    pullDistance,
    refreshing,
    pullHandlers: handlers,
    loadMoreRef,
    items,
    emptyLibraryItemsProps,
  };
}
