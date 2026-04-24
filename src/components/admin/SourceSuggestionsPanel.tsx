import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SourceSuggestionRow {
  id: string;
  category: 'signal' | 'grounding';
  suggested_name: string;
  suggested_url: string | null;
  suggested_type: string;
  dedupe_key: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  reviewed_at: string | null;
}

const CAT_LABEL: Record<string, string> = {
  signal: 'Signal',
  grounding: 'Grounding',
};

export function SourceSuggestionsPanel({ onCatalogChanged }: { onCatalogChanged?: () => void }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<SourceSuggestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('signal_source_suggestions')
      .select('id, category, suggested_name, suggested_url, suggested_type, dedupe_key, status, metadata, created_at, reviewed_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      toast({ title: 'Could not load suggestions', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((data ?? []) as SourceSuggestionRow[]);
  }, [toast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const approve = async (row: SourceSuggestionRow) => {
    setActing(row.id);
    const url = row.suggested_url?.trim() || null;
    const { error: insErr } = await supabase.from('signal_sources').insert({
      name: row.suggested_name.trim(),
      url,
      type: row.suggested_type || 'blog',
      category: row.category,
      demoted_for_live: false,
    });
    if (insErr) {
      toast({ title: 'Add to catalog failed', description: insErr.message, variant: 'destructive' });
      setActing(null);
      return;
    }
    const { error: upErr } = await supabase
      .from('signal_source_suggestions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setActing(null);
    if (upErr) {
      toast({ title: 'Marked approved failed', description: upErr.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Added to catalog', description: row.suggested_name });
    await fetchRows();
    onCatalogChanged?.();
  };

  const reject = async (row: SourceSuggestionRow) => {
    setActing(row.id);
    const { error } = await supabase
      .from('signal_source_suggestions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setActing(null);
    if (error) {
      toast({ title: 'Reject failed', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchRows();
  };

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
          onClick={() => fetchRows()}
          disabled={loading}
          className="text-[9px] font-mono text-muted-foreground/40 hover:text-primary flex items-center gap-1 shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && rows.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-3">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50 text-center py-3">No pending suggestions</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const busy = acting === row.id;
            // Writers persist `pause_instance_id` (Pause V2). Accept legacy
            // `reflection_id` only as a best-effort display fallback for any
            // suggestion rows still sitting in a pre-cutover environment.
            const rid = row.metadata && typeof row.metadata === 'object' && row.metadata !== null
              ? ('pause_instance_id' in row.metadata
                  ? String((row.metadata as { pause_instance_id?: string }).pause_instance_id ?? '')
                  : 'reflection_id' in row.metadata
                    ? String((row.metadata as { reflection_id?: string }).reflection_id ?? '')
                    : '')
              : '';
            return (
              <div key={row.id} className="rounded-lg border border-border/15 bg-card/5 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/80">{CAT_LABEL[row.category] ?? row.category}</span>
                    <span className="text-[10px] font-mono text-foreground/85 truncate">{row.suggested_name}</span>
                  </div>
                  {row.suggested_url && (
                    <a
                      href={row.suggested_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-primary/60 hover:text-primary truncate block mt-0.5"
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
                    className="inline-flex items-center gap-0.5 text-[9px] font-mono text-primary/80 hover:text-primary disabled:opacity-30"
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
