import { useState, useMemo, useCallback } from 'react';
import { Trash2, Loader2, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { LibraryEntryRow } from '@/hooks/use-admin-stats';
import { label } from './admin-constants';
import { FilterRow } from './FilterRow';
import { QualityBadge } from './QualityBadge';

const LIBRARY_TYPE_COLORS: Record<string, string> = {
  essay: '#8b5cf6',
  paper: '#06b6d4',
  event: '#f59e0b',
  article: '#10b981',
  book: '#6366f1',
  podcast: '#ec4899',
};

export function ContentLibraryViewer({ entries, onRefresh }: { entries: LibraryEntryRow[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(entries.map(e => e.type))).sort();
    return [
      { value: 'all', label: 'All' },
      ...types.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) + 's' })),
    ];
  }, [entries]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return entries;
    return entries.filter(e => e.type === typeFilter);
  }, [entries, typeFilter]);

  const deleteEntry = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from library?`)) return;
    setDeleting(id);
    const { error } = await supabase.from('content_library').update({ active: false } as any).eq('id', id);
    setDeleting(null);
    if (error) { toast({ title: 'Remove entry failed', description: error.message, variant: 'destructive' }); return; }
    onRefresh();
  }, [onRefresh, toast]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          Curated content library — essays, papers, and events used by AI companions.
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          Entries are matched to sources by author name. Deleting sets <span className="font-mono">active = false</span>.
        </p>
      </div>

      <FilterRow label="Type" options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
      <p className="text-[9px] font-mono text-muted-foreground/50">
        {filtered.length === entries.length
          ? `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`
          : `Showing ${filtered.length} of ${entries.length} — `}
        {filtered.length < entries.length && (
          <button onClick={() => setTypeFilter('all')} className="text-primary/70 hover:text-primary">clear filter</button>
        )}
      </p>

      <div className="space-y-1.5">
        {filtered.map(entry => {
          const isExpanded = expandedId === entry.id;
          const isDeleting = deleting === entry.id;
          return (
            <div key={entry.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `${LIBRARY_TYPE_COLORS[entry.type] ?? '#64748b'}20`,
                    color: LIBRARY_TYPE_COLORS[entry.type] ?? '#64748b',
                  }}>
                  {entry.type}
                </span>
                <button onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="text-[10px] font-mono text-foreground/80 truncate flex-1 min-w-0 text-left hover:text-primary transition-colors">
                  {entry.title}
                </button>
                <QualityBadge score={entry.quality_score} />
                <button onClick={() => deleteEntry(entry.id, entry.title)} disabled={isDeleting}
                  className="text-destructive/40 hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-30" title="Remove entry">
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
              <div className="flex items-center gap-3">
                {entry.author && <span className="text-[9px] text-muted-foreground/50">by {entry.author}</span>}
                <span className="text-[9px] text-muted-foreground/45">{new Date(entry.created_at).toLocaleDateString()}</span>
                {entry.url && (
                  <a href={entry.url} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] text-primary/60 hover:text-primary flex items-center gap-0.5 transition-colors">
                    <Globe className="h-2.5 w-2.5" /> link
                  </a>
                )}
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/40">
                {isExpanded ? entry.summary : entry.summary.slice(0, 80)}{!isExpanded && entry.summary.length > 80 ? '…' : ''}
              </p>
              {isExpanded && (
                <div className="pt-1 border-t border-border/5 space-y-1.5">
                  <p className="text-[9px] font-mono text-foreground/40 whitespace-pre-wrap break-words">{entry.summary}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground/50">{tag}</span>
                      ))}
                    </div>
                  )}
                  {entry.companion_types.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.companion_types.map(ct => (
                        <span key={ct} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/60">{label(ct)}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center py-3">
            {entries.length === 0 ? 'No library entries yet' : 'No entries match filter'}
          </p>
        )}
      </div>
    </div>
  );
}
