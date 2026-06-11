import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Loader2 } from 'lucide-react';
import { PageMeta } from '@/app/components/PageMeta';
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
    pauseArchive,
    pullDistance,
    refreshing,
    pullHandlers,
    loadMoreRef,
    items,
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

        <ArchivePauseItems
          items={items}
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
