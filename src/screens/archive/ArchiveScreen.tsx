import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { usePauseArchiveList } from '@/hooks/use-pause-archive-list';
import type { PauseArchiveRow, PauseArchiveSegment } from '@/features/pause/public-queries';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { PageMeta } from '@/app/components/PageMeta';
import { Search, X, ArrowUpDown, RefreshCw, Loader2 } from 'lucide-react';
import { ArchivePauseItems } from '@/screens/archive/components/ArchivePauseItems';
import { ArchiveCollectionsSection } from '@/screens/archive/components/ArchiveCollectionsSection';
import { CurrentPauseCard } from '@/components/library/CurrentPauseCard';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getArchivePausesTabHasRowsQueryOptions } from '@/features/pause/public-queries';
import type { ArchiveMainSegment } from '@/lib/archive-segment';

type SortMode = 'newest' | 'oldest' | 'alphabetical';

function readSegment(params: URLSearchParams): ArchiveMainSegment {
  const s = params.get('seg');
  if (s === 'echoes' || s === 'collections') return s;
  return 'pauses';
}

function readPausesScope(params: URLSearchParams): 'all' | 'favorites' {
  return params.get('scope') === 'favs' ? 'favorites' : 'all';
}

function rowMatchesSearch(row: PauseArchiveRow, q: string): boolean {
  const hay = [
    row.reflection_text,
    row.haiku_text,
    row.note_text,
    row.outcome,
    row.initial_mood,
    row.shift_mood,
    row.source,
    row.state,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

export default function Archive() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainSegment = useMemo(() => readSegment(searchParams), [searchParams]);
  const pausesScope = useMemo(() => readPausesScope(searchParams), [searchParams]);
  const libraryListFavoritesOnly = mainSegment === 'pauses' && pausesScope === 'favorites';

  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

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

  const availableTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    segmentBase.forEach((r) => {
      (r.tags ?? []).forEach((tag) => {
        if (!tag) return;
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [segmentBase]);

  const filtered = useMemo(() => {
    if (mainSegment === 'collections') return [];
    let result = segmentBase;
    if (tagFilter) {
      result = result.filter((r) => (r.tags ?? []).includes(tagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => rowMatchesSearch(r, q));
    }
    if (sortMode === 'oldest') {
      result = [...result].sort(
        (a, b) => new Date(sortKey(a)).getTime() - new Date(sortKey(b)).getTime(),
      );
    } else if (sortMode === 'alphabetical') {
      result = [...result].sort((a, b) => (a.source ?? '').localeCompare(b.source ?? ''));
    } else {
      result = [...result].sort(
        (a, b) => new Date(sortKey(b)).getTime() - new Date(sortKey(a)).getTime(),
      );
    }
    return result;
  }, [segmentBase, mainSegment, tagFilter, search, sortMode]);

  function sortKey(r: PauseArchiveRow) {
    return r.terminal_at ?? r.created_at ?? '';
  }

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
  }, [mainSegment, hasAnyEchoesContent, hasAnyPauseArchiveContent, pausesScope, hasActiveFilters, filtered.length, t]);

  const cycleSortMode = () => {
    setSortMode((prev) => (prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'alphabetical' : 'newest'));
  };

  const sortLabel =
    sortMode === 'newest'
      ? t('library.sortNewest', { defaultValue: 'Newest' })
      : sortMode === 'oldest'
        ? t('library.sortOldest', { defaultValue: 'Oldest' })
        : t('library.sortAlpha', { defaultValue: 'A–Z' });

  const clearAllFilters = () => {
    setTagFilter(null);
    setSearch('');
  };


  return (
    <div className="space-y-6 pb-24" {...handlers}>
      <PageMeta
        title={t('archive.pageTitle')}
        description={t('archive.pageDescription')}
        noindex
      />

      {mainSegment !== 'collections' && <CurrentPauseCard />}

      {pauseArchive.listLoadFailed && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 text-left">
            <p>{t('archive.loadFailed')}</p>
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => void pauseArchive.refetch()}>
              {t('common.tryAgain')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {(pullDistance > 10 || refreshing) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: Math.max(pullDistance, refreshing ? 36 : 0), opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center overflow-hidden"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 text-muted-foreground/40 transition-transform',
                refreshing && 'animate-spin',
                pullDistance > 70 && !refreshing && 'text-nox-text-link/70',
              )}
              style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-30 flex gap-4 border-b border-border/30 bg-background/95 py-2 backdrop-blur-sm">
        {(['pauses', 'echoes', 'collections'] as const).map((seg) => (
          <button
            key={seg}
            type="button"
            onClick={() => setMainSegment(seg)}
            className={cn(
              'border-b-2 pb-2 text-sm font-medium transition-colors',
              mainSegment === seg
                ? 'border-foreground font-bold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-muted-foreground/90',
            )}
          >
            {seg === 'pauses'
              ? t('archive.segmentPauses')
              : seg === 'echoes'
                ? t('archive.segmentEchoes')
                : t('library.tabCollections')}
          </button>
        ))}
      </div>

      {mainSegment === 'collections' && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{t('archive.collectionsBlurb')}</p>
          <ArchiveCollectionsSection listSort={sortMode} />
        </div>
      )}

      {mainSegment !== 'collections' && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mainSegment === 'pauses' ? t('archive.introPauses') : t('archive.introEchoes')}
          </p>

          {mainSegment === 'pauses' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPausesScope('all')}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-semibold transition-colors',
                  pausesScope === 'all' ? 'bg-foreground text-background' : 'border border-foreground/80 bg-transparent text-foreground',
                )}
              >
                {t('library.pillAll', { defaultValue: 'All' })}
              </button>
              <button
                type="button"
                onClick={() => setPausesScope('favorites')}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  pausesScope === 'favorites' ? 'bg-foreground text-background' : 'border border-foreground/80 bg-transparent text-foreground',
                )}
              >
                {t('library.pillFavs', { defaultValue: 'Favs' })}
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              id="archive-search"
              name="q"
              type="search"
              autoComplete="off"
              aria-label={t('archive.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('archive.searchPlaceholder')}
              className="h-9 border-border/30 pl-8 text-sm"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {availableTags.length > 0 && (
            <div className="scrollbar-none -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
              {availableTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-2 py-1 text-xs transition-colors',
                    tagFilter === tag
                      ? 'border-nox-border-focus/50 bg-nox-background-accent/40 text-nox-text-link'
                      : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70',
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-nox-text-link transition-colors hover:text-nox-text-link/80"
            >
              <X className="h-2.5 w-2.5" /> {t('archive.clearAll')}
            </button>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">
              {filtered.length === 1
                ? t('archive.itemCount_one', { count: filtered.length })
                : t('archive.itemCount_other', { count: filtered.length })}
            </span>
            <button
              type="button"
              onClick={cycleSortMode}
              className="flex items-center gap-1 text-sm text-nox-text-link transition-colors hover:text-nox-text-link/80"
            >
              <ArrowUpDown className="h-2.5 w-2.5" />
              {sortLabel}
            </button>
          </div>

          <ArchivePauseItems
            rows={rows}
            filtered={filtered}
            loading={pauseArchive.loading}
            listLoadFailed={pauseArchive.listLoadFailed}
            refetch={pauseArchive.refetch}
            echoesPresentation={mainSegment === 'echoes'}
            emptyStateMessage={emptyLibraryItemsProps.emptyStateMessage}
            emptyStateHint={emptyLibraryItemsProps.emptyStateHint}
            emptyCtaLabel={emptyLibraryItemsProps.emptyCtaLabel}
            emptyCtaTo={emptyLibraryItemsProps.emptyCtaTo}
          />

          {pauseArchive.hasMore && (
            <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-4">
              {pauseArchive.loadingMore && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" aria-hidden />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
