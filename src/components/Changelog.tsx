import { useState, useEffect } from 'react';
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

interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  changes: string[];
}

export function Changelog() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('changelog_entries')
      .select('id, version, date, changes')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setEntries((data as unknown as ChangelogEntry[]) ?? []);
        setLoading(false);
      });
  }, [open]);

  return (
    <>
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
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogAction className="font-mono text-xs">Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
