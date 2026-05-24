import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUpDown, RefreshCw, Loader2 } from 'lucide-react';
import { PageMeta } from '@/app/components/PageMeta';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArchivePauseItems } from '@/screens/archive/components/ArchivePauseItems';
import { CurrentPauseCard } from '@/screens/archive/components/library/CurrentPauseCard';
import { useArchiveScreen } from '@/screens/archive/hooks/use-archive-screen';

export default function Archive() {
  const {
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
    pullHandlers,
    loadMoreRef,
    rows,
    filtered,
    availableTags,
    emptyLibraryItemsProps,
  } = useArchiveScreen();

  return (
    <div className="space-y-6 pb-24" {...pullHandlers}>
      <PageMeta
        title={t('archive.pageTitle')}
        description={t('archive.pageDescription')}
        noindex
      />

      <CurrentPauseCard />

      {pauseArchive.listLoadFailed && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-3 text-left">
            <p>{t('archive.loadFailed')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => void pauseArchive.refetch()}
            >
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
        {(['pauses', 'echoes'] as const).map((seg) => (
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
            {seg === 'pauses' ? t('archive.segmentPauses') : t('archive.segmentEchoes')}
          </button>
        ))}
      </div>

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
                pausesScope === 'all'
                  ? 'bg-foreground text-background'
                  : 'border border-foreground/80 bg-transparent text-foreground',
              )}
            >
              {t('library.pillAll', { defaultValue: 'All' })}
            </button>
            <button
              type="button"
              onClick={() => setPausesScope('favorites')}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                pausesScope === 'favorites'
                  ? 'bg-foreground text-background'
                  : 'border border-foreground/80 bg-transparent text-foreground',
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
            {pauseArchive.loadingMore && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" aria-hidden />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
