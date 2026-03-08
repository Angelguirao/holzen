import { useState, useEffect, useCallback, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const PAGE_SIZE = 15;

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  changes: string[];
  created_at: string;
}

export const Changelog = forwardRef<HTMLDivElement, object>(function Changelog(_props, ref) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('changelog_entries')
      .select('id, version, date, changes, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
      .then(({ data }) => {
        const rows = (data as unknown as ChangelogEntry[]) ?? [];
        setEntries(rows);
        setHasMore(rows.length === PAGE_SIZE);
        setLoading(false);
      });
  }, [open]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const last = entries[entries.length - 1];
    if (!last) { setLoadingMore(false); return; }
    const { data } = await supabase
      .from('changelog_entries')
      .select('id, version, date, changes, created_at')
      .order('created_at', { ascending: false })
      .lt('created_at', last.created_at)
      .limit(PAGE_SIZE);
    const rows = (data as unknown as ChangelogEntry[]) ?? [];
    setEntries((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, entries]);

  const sentinelRef = useInfiniteScroll({ hasMore, loading: loadingMore, onLoadMore: loadMore });

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-mono text-muted-foreground underline"
      >
        What's new
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-sm">Changelog</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Version history</AlertDialogDescription>
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
              {loadingMore && (
                <p className="text-[10px] font-mono text-muted-foreground animate-pulse text-center">Loading more…</p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction className="font-mono text-xs">Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});
