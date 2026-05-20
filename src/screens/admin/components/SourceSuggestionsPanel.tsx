import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  approveSignalSourceSuggestion,
  rejectSignalSourceSuggestion,
} from '@/features/user/public-queries';
import {
  ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_KEY,
  fetchPendingSourceSuggestionsRows,
  getAdminPendingSourceSuggestionsQueryOptions,
  type SourceSuggestionRow,
} from '@/screens/admin/lib/admin-source-suggestions-query';

export type { SourceSuggestionRow };

const CAT_LABEL: Record<string, string> = {
  signal: 'Signal',
  grounding: 'Grounding',
};

export function SourceSuggestionsPanel({ onCatalogChanged }: { onCatalogChanged?: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acting, setActing] = useState<string | null>(null);

  const {
    data: rows = [],
    isPending,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    ...getAdminPendingSourceSuggestionsQueryOptions(),
    queryFn: async () => {
      try {
        return await fetchPendingSourceSuggestionsRows();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        toast({ title: 'Could not load suggestions', description: message, variant: 'destructive' });
        throw error;
      }
    },
  });

  const bumpSuggestions = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ADMIN_PENDING_SOURCE_SUGGESTIONS_QUERY_KEY });
  }, [queryClient]);

  const approve = async (row: SourceSuggestionRow) => {
    setActing(row.id);
    const result = await approveSignalSourceSuggestion({
      suggestionId: row.id,
      suggested_name: row.suggested_name,
      suggested_url: row.suggested_url,
      suggested_type: row.suggested_type,
      category: row.category,
    });
    setActing(null);
    if (!result.ok) {
      toast({
        title: result.failedStep === 'insert' ? 'Add to catalog failed' : 'Marked approved failed',
        description: result.errorMessage,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Added to catalog', description: row.suggested_name });
    await bumpSuggestions();
    onCatalogChanged?.();
  };

  const reject = async (row: SourceSuggestionRow) => {
    setActing(row.id);
    const { ok, errorMessage } = await rejectSignalSourceSuggestion(row.id);
    setActing(null);
    if (!ok) {
      toast({ title: 'Reject failed', description: errorMessage ?? 'Unknown error', variant: 'destructive' });
      return;
    }
    await bumpSuggestions();
  };

  const initialLoad = isPending && rows.length === 0;

  return (
    <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-mono text-foreground/70">Suggested sources (from live AI)</p>
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed mt-1">
            When Signal or Grounding completes a live web search, we queue a candidate here. Approve adds it to the catalog; reject dismisses. Duplicates (same URL) are skipped automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-[9px] font-sans font-medium text-muted-foreground/40 hover:text-nox-text-link flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {initialLoad ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-3">Loading…</p>
      ) : isError && rows.length === 0 ? (
        <div className="text-center py-3 space-y-2">
          <p className="text-[10px] text-muted-foreground/60">Could not load suggestions.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-[9px] font-mono text-nox-text-link/80 hover:text-nox-text-link"
          >
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-3">No pending suggestions</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const busy = acting === row.id;
            // Writers persist `pause_instance_id` (Pause V2) for attribution; legacy rows may use `reflection_id`.
            const meta = row.metadata && typeof row.metadata === 'object' && row.metadata !== null
              ? (row.metadata as { pause_instance_id?: string; reflection_id?: string })
              : null;
            const rid = meta
              ? String(meta.pause_instance_id ?? meta.reflection_id ?? '')
              : '';
            return (
              <div key={row.id} className="rounded-lg border border-border/15 bg-card/5 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{CAT_LABEL[row.category] ?? row.category}</span>
                    <span className="text-[10px] font-mono text-foreground/85 truncate">{row.suggested_name}</span>
                  </div>
                  {row.suggested_url && (
                    <a
                      href={row.suggested_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link truncate block mt-0.5"
                    >
                      {row.suggested_url}
                    </a>
                  )}
                  {rid && (
                    <p className="text-[8px] font-mono text-muted-foreground/35 mt-1 truncate">pause {rid.slice(0, 8)}…</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => approve(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-0.5 text-[9px] font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link disabled:opacity-30"
                  >
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(row)}
                    disabled={busy}
                    className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/50 hover:text-destructive/80 disabled:opacity-30"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
