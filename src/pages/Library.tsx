import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibrary, type LibraryItem } from '@/hooks/use-library';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { PageMeta } from '@/components/PageMeta';
import {
  Search,
  X,
  Lock,
  ArrowUpDown,
  RefreshCw,
  ArrowRight,
  Pause,
  Radio,
  Leaf,
  Feather,
  Telescope,
  ScrollText,
  Pencil,
  Link as LinkIcon,
  Loader2,
  Filter,
  type LucideIcon,
} from 'lucide-react';
import { ExportMenu } from '@/components/library/ExportMenu';
import { SubscriptionSkeleton } from '@/components/SubscriptionSkeleton';
import { LibraryItems } from '@/components/library/LibraryItems';
import { LibraryCollections } from '@/components/library/LibraryCollections';
import { SmartCollections } from '@/components/library/SmartCollections';
import { CurrentPauseCard } from '@/components/library/CurrentPauseCard';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { DuplicateBanner } from '@/components/library/DuplicateBanner';

import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { useProGate } from '@/hooks/use-pro-gate';
import { librarySourceLabel } from '@/lib/library-source-label';
import type { ArchiveMainSegment } from '@/lib/archive-segment';
import { normalizeLibrarySourceType } from '@/lib/normalize-library-source-type';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SOURCE_CHIPS: { key: string; icon: LucideIcon }[] = [
  { key: 'pause', icon: Pause },
  { key: 'signal', icon: Radio },
  { key: 'grounding', icon: Leaf },
  { key: 'haiku', icon: Feather },
  { key: 'zoom_out', icon: Telescope },
  { key: 'history_insight', icon: ScrollText },
  { key: 'pause_note', icon: Pencil },
  { key: 'external', icon: LinkIcon },
];

type SortMode = 'newest' | 'oldest' | 'alphabetical';

function readSegment(params: URLSearchParams): ArchiveMainSegment {
  const s = params.get('seg');
  if (s === 'echoes' || s === 'collections') return s;
  return 'pauses';
}

function readPausesScope(params: URLSearchParams): 'all' | 'favorites' {
  return params.get('scope') === 'favs' ? 'favorites' : 'all';
}

export default function Library() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPro, isPending, startCheckout, checkoutLoading } = useProGate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainSegment = useMemo(() => readSegment(searchParams), [searchParams]);
  const pausesScope = useMemo(() => readPausesScope(searchParams), [searchParams]);
  const libraryListFavoritesOnly = mainSegment === 'pauses' && pausesScope === 'favorites';
  const [pausesTabHasArchiveRows, setPausesTabHasArchiveRows] = useState<boolean | null>(null);
  const [pausesArchiveCountNonce, setPausesArchiveCountNonce] = useState(0);
  const [pauseDupScanItems, setPauseDupScanItems] = useState<LibraryItem[]>([]);

  const [search, setSearch] = useState('');
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [smartFilter, setSmartFilter] = useState<{ name: string; itemIds: Set<string> } | null>(null);

  const hasActiveFilters =
    selectedSourceTypes.length > 0 || !!tagFilter || !!smartFilter || !!search.trim();

  const archiveListKind =
    mainSegment === 'echoes' ? 'echo' : mainSegment === 'pauses' ? 'pauses' : 'default';

  const library = useLibrary({
    archiveListKind,
    favoritesOnly: libraryListFavoritesOnly,
    listSort: sortMode,
    pausesArchiveSourceTypes: mainSegment === 'pauses' ? selectedSourceTypes : undefined,
  });

  const setMainSegment = useCallback(
    (seg: ArchiveMainSegment) => {
      setSelectedSourceTypes([]);
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

  useEffect(() => {
    if (!user?.id || mainSegment !== 'pauses') {
      setPausesTabHasArchiveRows(mainSegment !== 'pauses' ? false : null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { count, error } = await supabase
        .from('library_archive_pauses_tab_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('source_type', 'pause');
      if (!cancelled) {
        if (!error) setPausesTabHasArchiveRows((count ?? 0) > 0);
        else setPausesTabHasArchiveRows(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, mainSegment, pausesArchiveCountNonce]);

  useEffect(() => {
    if (!user?.id || mainSegment !== 'pauses') {
      setPauseDupScanItems([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('library_archive_pauses_tab_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('source_type', 'pause')
        .not('body', 'is', null)
        .order('created_at', { ascending: true })
        .limit(500);
      if (!cancelled) {
        if (!error && data) setPauseDupScanItems(data as unknown as LibraryItem[]);
        else setPauseDupScanItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, mainSegment, pausesArchiveCountNonce]);

  const handleRefresh = useCallback(async () => {
    if (mainSegment === 'pauses') {
      setPausesArchiveCountNonce((n) => n + 1);
    }
    await library.refetch();
  }, [library, mainSegment]);

  const { pullDistance, refreshing, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 70,
  });

  const loadMoreRootMargin = mainSegment === 'echoes' ? '80px' : '200px';
  const loadMoreRef = useInfiniteScroll({
    hasMore: library.hasMore,
    loading: library.loadingMore,
    onLoadMore: library.loadMore,
    rootMargin: loadMoreRootMargin,
  });

  const { items, collections } = library;

  const sourceChips = useMemo(
    () => SOURCE_CHIPS.map((c) => ({ ...c, label: librarySourceLabel(c.key, t, c.key) })),
    [t],
  );

  const segmentBase = useMemo(
    () => items.filter((i) => i.status !== 'deleted' && i.status !== 'archived'),
    [items],
  );

  const hasAnyPauseArchiveContent = useMemo(() => {
    if (mainSegment !== 'pauses') return false;
    return (
      pausesTabHasArchiveRows ??
      items.some((i) => i.status !== 'deleted' && i.status !== 'archived')
    );
  }, [mainSegment, pausesTabHasArchiveRows, items]);

  const hasAnyEchoesContent = useMemo(() => {
    if (mainSegment !== 'echoes') return false;
    return items.some((i) => i.status !== 'deleted' && i.status !== 'archived');
  }, [mainSegment, items]);

  /** Pauses list defaults to `pause` only; chips still list every filterable type. */
  const availableSources = useMemo(() => {
    if (mainSegment !== 'pauses') return [];
    return sourceChips;
  }, [mainSegment, sourceChips]);

  const availableTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    segmentBase.forEach((i) => {
      i.tags?.forEach((tag) => {
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
    // Pauses: `source_type` is applied server-side (`useLibrary`); Echoes: view membership only.
    // Search, tags, and smart lists filter client-side over loaded pages.
    if (smartFilter) result = result.filter((i) => smartFilter.itemIds.has(i.id));
    if (tagFilter) result = result.filter((i) => i.tags?.includes(tagFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.body?.toLowerCase().includes(q) ||
          i.tags?.some((tg) => tg.toLowerCase().includes(q)),
      );
    }
    if (sortMode === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortMode === 'alphabetical') {
      result = [...result].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    }
    return result;
  }, [segmentBase, mainSegment, smartFilter, tagFilter, search, sortMode]);

  const clearAllFilters = () => {
    setSelectedSourceTypes([]);
    setTagFilter(null);
    setSmartFilter(null);
    setSearch('');
  };

  const cycleSortMode = () => {
    setSortMode((prev) => (prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'alphabetical' : 'newest'));
  };

  const sortLabel =
    sortMode === 'newest'
      ? t('library.sortNewest', { defaultValue: 'Newest' })
      : sortMode === 'oldest'
        ? t('library.sortOldest', { defaultValue: 'Oldest' })
        : t('library.sortAlpha', { defaultValue: 'A–Z' });

  const toggleSourceType = (key: string) => {
    setSelectedSourceTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const removeSourceType = (key: string) => {
    setSelectedSourceTypes((prev) => prev.filter((k) => k !== key));
  };

  const emptyLibraryItemsProps = useMemo(() => {
    if (mainSegment === 'echoes') {
      if (!hasAnyEchoesContent) {
        return {
          emptyStateMessage: t('library.emptyEchoesNone', {
            defaultValue:
              'Nothing here yet. Reflections you save from echo pauses will appear in this list.',
          }),
          emptyStateHint: '',
          emptyCtaLabel: undefined as string | undefined,
          emptyCtaTo: undefined as string | undefined,
        };
      }
    }
    if (mainSegment === 'pauses') {
      if (!hasAnyPauseArchiveContent && pausesScope === 'all' && !hasActiveFilters) {
        return {
          emptyStateMessage: t('library.emptyPauseFirst', {
            defaultValue: 'Your content will appear here after your first pause.',
          }),
          emptyStateHint: '',
          emptyCtaLabel: t('library.emptyPauseFirstCta', { defaultValue: 'Start a pause' }),
          emptyCtaTo: '/pause',
        };
      }
      if (pausesScope === 'favorites' && filtered.length === 0 && hasAnyPauseArchiveContent) {
        return {
          emptyStateMessage: t('library.emptyFavs', {
            defaultValue: 'Nothing saved yet. Keep what matters.',
          }),
          emptyStateHint: '',
          emptyCtaLabel: undefined as string | undefined,
          emptyCtaTo: undefined as string | undefined,
        };
      }
    }
    if (hasActiveFilters && filtered.length === 0) {
      return {
        emptyStateMessage: t('library.noResults', { defaultValue: 'No items match your search.' }),
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

  if (isPending) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('common.holzen')}</span>
          <h1 className="text-base font-medium text-foreground">{t('library.title')}</h1>
          <div className="w-9" />
        </div>
        <SubscriptionSkeleton variant="inline" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('common.holzen')}</span>
          <h1 className="text-base font-medium text-foreground">{t('library.title')}</h1>
          <div className="w-9" />
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
          <Lock className="h-6 w-6 text-[#dbb266]" />
          <h2 className="text-sm font-semibold text-foreground">{t('pro.featureLocked')}</h2>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('pro.desc_library')}</p>
          <button
            type="button"
            onClick={() => startCheckout('pro')}
            disabled={checkoutLoading}
            className="group inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 transition-colors hover:underline disabled:opacity-50"
            style={{ color: '#24B2C8' }}
          >
            {t('pro.upgradeCta')}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  }

  const filterDisabled = mainSegment === 'pauses' && segmentBase.length === 0;

  return (
    <div className="space-y-6 pb-24" {...handlers}>
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />

      {mainSegment !== 'collections' && <CurrentPauseCard />}

      {library.listLoadFailed && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 text-left">
            <p>{t('library.loadFailed')}</p>
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => void library.refetch()}>
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
                pullDistance > 70 && !refreshing && 'text-primary/60',
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
              ? t('library.segmentPauses', { defaultValue: 'Pauses' })
              : seg === 'echoes'
                ? t('library.segmentEchoes', { defaultValue: 'Echoes' })
                : t('library.tabCollections')}
          </button>
        ))}
      </div>

      {mainSegment === 'collections' && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{t('library.pageDescription')}</p>
          <SmartCollections
            items={items}
            isReflectionIncomplete={library.isReflectionIncomplete}
            onSelect={(sc) => {
              setSmartFilter({ name: sc.name, itemIds: new Set(sc.items.map((i) => i.id)) });
              setMainSegment('pauses');
            }}
          />
          <LibraryCollections library={library} />
        </div>
      )}

      {mainSegment !== 'collections' && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {mainSegment === 'pauses'
              ? t('library.archiveIntroPauses', {
                  defaultValue:
                    'See content from your recent pauses and favourites. Save what matters. Explore with filters.',
                })
              : t('library.archiveIntroEchoes', {
                  defaultValue:
                    'Reflections from pauses you missed. Read at your own pace. Save what speaks to you.',
                })}
          </p>

          {mainSegment === 'pauses' && (
            <div className="flex flex-col gap-3">
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
                <div className="flex-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={filterDisabled}
                      className={cn(filterDisabled && 'opacity-50')}
                      aria-label={t('library.filterTypesLabel', { defaultValue: 'Filter by type' })}
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('library.filterTypesLabel', { defaultValue: 'Types' })}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availableSources.length === 0 ? (
                      <div className="px-2 py-2 text-xs text-muted-foreground">{t('library.filterNoTypes', { defaultValue: 'No types yet' })}</div>
                    ) : (
                      availableSources.map(({ key, label }) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={selectedSourceTypes.includes(key)}
                          onCheckedChange={() => toggleSourceType(key)}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {selectedSourceTypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {selectedSourceTypes.map((key) => {
                    const chip = sourceChips.find((c) => c.key === key);
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 rounded-full border border-foreground/80 px-2 py-0.5 text-xs font-medium"
                      >
                        {chip?.label ?? key}
                        <button
                          type="button"
                          onClick={() => removeSourceType(key)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                          aria-label={t('library.removeFilterChip', { defaultValue: 'Remove filter' })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <Input
              id="library-search"
              name="q"
              type="search"
              autoComplete="off"
              aria-label={t('library.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('library.searchPlaceholder')}
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
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70',
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {smartFilter && (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-mono text-primary">
                {smartFilter.name}
              </span>
              <button type="button" onClick={() => setSmartFilter(null)} className="text-muted-foreground/40 hover:text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {hasActiveFilters && !smartFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-nox-text-link transition-colors hover:text-nox-text-link/80"
            >
              <X className="h-2.5 w-2.5" /> {t('library.clearAll')}
            </button>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">
              {filtered.length === 1
                ? t('library.itemCount_one', { count: filtered.length })
                : t('library.itemCount_other', { count: filtered.length })}
            </span>
            <div className="flex items-center gap-3">
              <ExportMenu items={filtered} />
              <button
                type="button"
                onClick={cycleSortMode}
                className="flex items-center gap-1 text-sm text-nox-text-link transition-colors hover:text-nox-text-link/80"
              >
                <ArrowUpDown className="h-2.5 w-2.5" />
                {sortLabel}
              </button>
            </div>
          </div>

          <DuplicateBanner
            items={pauseDupScanItems.length > 0 ? pauseDupScanItems : items}
            onDeleteItem={library.deleteItem}
            onSelectItem={() => {}}
          />

          <LibraryItems
            library={library}
            filtered={filtered}
            dateGroupStyle="calendarDay"
            echoesPresentation={mainSegment === 'echoes'}
            emptyStateMessage={emptyLibraryItemsProps.emptyStateMessage}
            emptyStateHint={emptyLibraryItemsProps.emptyStateHint}
            emptyCtaLabel={emptyLibraryItemsProps.emptyCtaLabel}
            emptyCtaTo={emptyLibraryItemsProps.emptyCtaTo}
          />

          {library.hasMore && (
            <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center py-4">
              {library.loadingMore && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" aria-hidden />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
