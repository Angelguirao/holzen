import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useLibrary } from '@/hooks/use-library';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { PageMeta } from '@/components/PageMeta';
import { Heart, Search, X, Lock, ArrowUpDown, RefreshCw, ArrowRight, Pause, Radio, Leaf, Feather, Telescope, ScrollText, Pencil, Link as LinkIcon, Loader2, type LucideIcon } from 'lucide-react';
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
import { useProGate } from '@/hooks/use-pro-gate';
import { PageHeading } from '@/components/PageHeading';
import { librarySourceLabel } from '@/lib/library-source-label';

// Keys match `library_items.source_type` in Postgres (row-kind discriminator for filters + UI).
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


type Tab = 'all' | 'favorites' | 'collections';
type SortMode = 'newest' | 'oldest' | 'alphabetical';

export default function Library() {
  const { t } = useTranslation();
  const { isPro, isPending, startCheckout, checkoutLoading } = useProGate();
  const library = useLibrary();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string | null>('pause');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [smartFilter, setSmartFilter] = useState<{ name: string; itemIds: Set<string> } | null>(null);

  const handleRefresh = useCallback(async () => {
    await library.refetch();
  }, [library]);

  const { pullDistance, refreshing, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 70,
  });

  const loadMoreRef = useInfiniteScroll({
    hasMore: library.hasMore,
    loading: library.loadingMore,
    onLoadMore: library.loadMore,
  });

  const { items, collections } = library;

  const sourceChips = useMemo(
    () => SOURCE_CHIPS.map((c) => ({ ...c, label: librarySourceLabel(c.key, t, c.key) })),
    [t]
  );

  // Available source types from actual data
  const availableSources = useMemo(() => {
    const existing = new Set(items.map((i) => i.source_type).filter(Boolean));
    return sourceChips.filter((f) => existing.has(f.key));
  }, [items, sourceChips]);

  // Available tags from actual data (sorted by frequency)
  const availableTags = useMemo(() => {
    const tagCount = new Map<string, number>();
    items.forEach((i) => {
      i.tags?.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [items]);

  const hasActiveFilters = !!sourceFilter || !!tagFilter || !!smartFilter;

  // Filtering
  const filtered = useMemo(() => {
    let result = items;
    // Tab
    if (tab === 'favorites') result = result.filter((i) => i.is_favorite);
    // Always hide deleted and archived
    result = result.filter((i) => i.status !== 'deleted' && i.status !== 'archived');
    // Smart filter
    if (smartFilter) result = result.filter((i) => smartFilter.itemIds.has(i.id));
    // Source type
    if (sourceFilter) result = result.filter((i) => i.source_type === sourceFilter);
    // Tag
    if (tagFilter) result = result.filter((i) => i.tags?.includes(tagFilter));
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.body?.toLowerCase().includes(q) ||
        i.tags?.some((t) => t.includes(q))
      );
    }
    // Sort
    if (sortMode === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortMode === 'alphabetical') {
      result = [...result].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
    }
    // newest is the default order from the hook
    return result;
  }, [items, tab, sourceFilter, tagFilter, search, sortMode, smartFilter]);

  if (isPending) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <PageHeading title={t('library.title')} subtitle={t('library.pageDescription')} />
        <SubscriptionSkeleton variant="inline" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="space-y-6 pb-24">
        <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
        <PageHeading title={t('library.title')} subtitle={t('library.pageDescription')} />
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6">
          <Lock className="h-6 w-6 text-[#dbb266]" />
          <h2 className="text-sm font-semibold text-foreground">{t('pro.featureLocked')}</h2>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('pro.desc_library')}</p>
          <button
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

  const clearAllFilters = () => {
    setSourceFilter(null);
    setTagFilter(null);
    setSmartFilter(null);
  };

  const cycleSortMode = () => {
    setSortMode((prev) =>
      prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'alphabetical' : 'newest'
    );
  };

  const sortLabel = sortMode === 'newest' ? t('library.sortNewest', { defaultValue: 'Newest' }) : sortMode === 'oldest' ? t('library.sortOldest', { defaultValue: 'Oldest' }) : t('library.sortAlpha', { defaultValue: 'A–Z' });

  return (
    <div className="space-y-6 pb-24" {...handlers}>
      <PageMeta title={t('library.pageTitle')} description={t('library.pageDescription')} />
      <PageHeading title={t('library.title')} subtitle={t('library.pageDescription')} />
      {/* Current pause card (Pause V2). Hidden when the user has no open pause. */}
      <CurrentPauseCard />

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

      {/* Pull-to-refresh indicator */}
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
                pullDistance > 70 && !refreshing && 'text-primary/60'
              )}
              style={{ transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab bar - sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm flex items-center gap-1 border-b border-border/30 overflow-x-auto">
        <button
          onClick={() => setTab('all')}
          className={cn(
            'border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap',
            tab === 'all'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          {t('library.tabAll')}
        </button>
        <button
          onClick={() => setTab('favorites')}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap',
            tab === 'favorites'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          <Heart className="h-3 w-3" />
          {t('library.tabFavorites')}
        </button>
        <button
          onClick={() => setTab('collections')}
          className={cn(
            'border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap',
            tab === 'collections'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground/50 hover:text-muted-foreground'
          )}
        >
          {t('library.tabCollections')}
          {collections.length > 0 && (
            <span className="ml-1.5 text-[9px] text-muted-foreground/40">{collections.length}</span>
          )}
        </button>
      </div>

      {/* Collections tab */}
      {tab === 'collections' && (
        <div className="space-y-4">
          <SmartCollections
            items={items}
            isReflectionIncomplete={library.isReflectionIncomplete}
            onSelect={(sc) => {
              setSmartFilter({ name: sc.name, itemIds: new Set(sc.items.map((i) => i.id)) });
              setTab('all');
            }}
          />
          <LibraryCollections library={library} />
        </div>
      )}

      {/* All / Favorites tabs */}
      {tab !== 'collections' && (
        <div className="space-y-3 !mt-4">
          {/* Sticky controls: tabs are above; here we stick search + source chips */}
          <div className="sticky top-[36px] z-20 -mx-1 px-1 pt-4 pb-2 space-y-3 bg-background/95 backdrop-blur-sm">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input
                id="library-search"
                name="q"
                type="search"
                autoComplete="off"
                aria-label={t('library.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('library.searchPlaceholder')}
                className="h-8 border-border/30 pl-8 text-xs py-[16px] mb-[24px]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Source type chips (horizontal scroll) */}
            {availableSources.length > 1 && (
              <div className="tabs-scroll gap-1.5 overflow-x-auto pb-0.5 flex items-center justify-start">
                {availableSources.map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
                    className={cn(
                      'px-2 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 text-sm font-sans mb-[16px]',
                      sourceFilter === key
                        ? 'border-foreground/20 bg-foreground/5 text-foreground'
                        : 'border-border/30 text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tag chips (NOT fixed) */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
              {availableTags.slice(0, 15).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                  className={cn(
                    'px-2 py-1 rounded-full border transition-colors whitespace-nowrap text-sm font-sans',
                    tagFilter === tag
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border/30 text-muted-foreground/50 hover:text-muted-foreground/70'
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Smart filter badge */}
          {smartFilter && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                {smartFilter.name}
              </span>
              <button
                onClick={() => setSmartFilter(null)}
                className="text-muted-foreground/40 hover:text-muted-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Active filter clear-all */}
          {hasActiveFilters && !smartFilter && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 transition-colors text-nox-text-link hover:text-nox-text-link/80 text-sm font-sans"
            >
              <X className="h-2.5 w-2.5" /> {t('library.clearAll')}
            </button>
          )}

          {/* Count + Sort */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-sans text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </span>
            <div className="flex items-center gap-3">
              <ExportMenu items={filtered} />
              <button
                onClick={cycleSortMode}
                className="flex items-center gap-1 transition-colors text-nox-text-link hover:text-nox-text-link/80 text-sm font-sans"
              >
                <ArrowUpDown className="h-2.5 w-2.5" />
                {sortLabel}
              </button>
            </div>
          </div>

          {/* Duplicate detection banner */}
          <DuplicateBanner
            items={items}
            onDeleteItem={library.deleteItem}
            onSelectItem={() => {}}
          />

          {/* Item list - natural page scroll */}
          <LibraryItems library={library} filtered={filtered} />

          {/* Infinite scroll sentinel — only when no client-side filters reduce results */}
          {library.hasMore && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-6">
              {library.loadingMore && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}