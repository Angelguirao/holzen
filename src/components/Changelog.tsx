import { useState, useCallback, useMemo, forwardRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  CHANGELOG_ENTRIES_QUERY_KEY,
  getChangelogEntriesInfiniteQueryOptions,
  prefetchChangelogEntriesFirstPage,
} from '@/lib/changelog-query';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';

export type ChangelogProps = {
  /** Fires when the user opens “What’s new” (before the dialog opens). */
  onWhatsNewOpen?: () => void;
};

export const Changelog = forwardRef<HTMLDivElement, ChangelogProps>(function Changelog(
  { onWhatsNewOpen },
  ref,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const {
    data,
    isPending,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(getChangelogEntriesInfiniteQueryOptions(open));

  const entries = useMemo(() => data?.pages.flat() ?? [], [data]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        queryClient.removeQueries({ queryKey: CHANGELOG_ENTRIES_QUERY_KEY });
      }
    },
    [queryClient],
  );

  const onLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useInfiniteScroll({
    hasMore: Boolean(hasNextPage),
    loading: isFetchingNextPage,
    onLoadMore,
  });

  const loading = open && isPending;

  return (
    <div ref={ref}>
      <button
        type="button"
        onMouseEnter={() => void prefetchChangelogEntriesFirstPage(queryClient)}
        onFocus={() => void prefetchChangelogEntriesFirstPage(queryClient)}
        onClick={() => {
          onWhatsNewOpen?.();
          setOpen(true);
        }}
        className="text-muted-foreground underline text-sm font-sans"
      >
        {t('changelog.whatsNew')}
      </button>

      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">{t('changelog.title')}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">{t('changelog.versionHistory')}</AlertDialogDescription>
          </AlertDialogHeader>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-mono font-medium">v{entry.version}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{entry.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        · {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center">{t('common.loadingMore')}</p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction className="font-mono text-xs">{t('changelog.close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
