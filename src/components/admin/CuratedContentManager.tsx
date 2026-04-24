import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CacheEntryRow } from '@/hooks/use-admin-stats';
import { Checkbox } from '@/components/ui/checkbox';
import { TYPE_COLORS, label } from './admin-constants';
import { FilterRow } from './FilterRow';
import { QualityBadge } from './QualityBadge';
import { AdminBulkBar } from './AdminBulkBar';
import { adminDeleteOneRow, adminDeleteRowsByIds } from '@/lib/admin-delete';

const QUALITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'curated', label: 'Curated' },
  { value: 'good', label: 'Good' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'expiring', label: 'Expiring' },
];

const DELETE_CHUNK = 40;

export function CuratedContentManager({ entries, onRefresh }: { entries: CacheEntryRow[]; onRefresh: () => Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [qualityFilter, setQualityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!open) setSelectedIds(new Set());
  }, [open]);

  const filteredEntries = useMemo(() => entries.filter(e => {
    if (qualityFilter === 'curated' && e.quality_score < 3) return false;
    if (qualityFilter === 'good' && e.quality_score !== 2) return false;
    if (qualityFilter === 'low' && e.quality_score >= 2) return false;
    if (statusFilter === 'permanent' && e.expires_at !== null) return false;
    if (statusFilter === 'expiring' && e.expires_at === null) return false;
    return true;
  }), [entries, qualityFilter, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, CacheEntryRow[]>();
    for (const e of filteredEntries) {
      if (!map.has(e.companion_type)) map.set(e.companion_type, []);
      map.get(e.companion_type)!.push(e);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEntries]);

  const promote = useCallback(async (id: string) => {
    setActing(id);
    const { error } = await supabase.from('companion_cache').update({ quality_score: 3, expires_at: null }).eq('id', id);
    if (error) { toast({ title: 'Promote failed', description: error.message, variant: 'destructive' }); setActing(null); return; }
    await onRefresh();
    setActing(null);
  }, [onRefresh, toast]);

  const demote = useCallback(async (id: string) => {
    setActing(id);
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('companion_cache').update({ quality_score: 1, expires_at: expires }).eq('id', id);
    if (error) { toast({ title: 'Demote failed', description: error.message, variant: 'destructive' }); setActing(null); return; }
    await onRefresh();
    setActing(null);
  }, [onRefresh, toast]);

  /** Keep row in pool but deprioritize for cache picks (attribution treated as untrusted server-side). */
  const setSourceUntrusted = useCallback(async (id: string, untrusted: boolean) => {
    setActing(id);
    const { error } = await supabase.from('companion_cache').update({ source_untrusted: untrusted }).eq('id', id);
    if (error) { toast({ title: 'Update failed', description: error.message, variant: 'destructive' }); setActing(null); return; }
    await onRefresh();
    setActing(null);
  }, [onRefresh, toast]);

  const remove = useCallback(async (id: string) => {
    if (!window.confirm('Delete this cache entry? This cannot be undone.')) return;
    setActing(id);
    const { ok, errorMessage } = await adminDeleteOneRow('companion_cache', id);
    if (!ok) { toast({ title: 'Delete failed', description: errorMessage ?? 'Unknown error', variant: 'destructive' }); setActing(null); return; }
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    await onRefresh();
    setActing(null);
  }, [onRefresh, toast]);

  const idsShown = useMemo(() => filteredEntries.map((e) => e.id), [filteredEntries]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(idsShown);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [idsShown]);

  const bulkDelete = useCallback(async () => {
    const ids = idsShown.filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} cache entr${ids.length === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const { deleted, errorMessage } = await adminDeleteRowsByIds('companion_cache', ids, DELETE_CHUNK);
      if (errorMessage) {
        toast({ title: 'Bulk delete failed', description: errorMessage, variant: 'destructive' });
        return;
      }
      setSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
      await onRefresh();
      toast({ title: 'Deleted', description: `${deleted} cache entr${deleted === 1 ? 'y' : 'ies'} removed.` });
    } finally {
      setBulkBusy(false);
    }
  }, [idsShown, selectedIds, onRefresh, toast]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          Pregen pool (<code className="text-muted-foreground/60">companion_cache</code>). Signal / Grounding / History try the <strong className="font-normal text-muted-foreground/65">Library</strong> tab first, then this pool, then live AI, then tiny hardcoded fallbacks (those show as “curated” in Monitor serve counts, not here).
        </p>
        <p className="text-[9px] text-muted-foreground/55 leading-relaxed">
          Order for those companions: <span className="text-muted-foreground/70">Library</span> → <span className="text-muted-foreground/70">this cache</span> → <span className="text-muted-foreground/70">live</span> → <span className="text-muted-foreground/70">hardcoded</span>. Manage long-form curated pieces under Library; manage pool rows here; edit last-resort strings under the <strong className="font-normal text-muted-foreground/65">Fallbacks</strong> tab.
        </p>
        <p className="text-[10px] font-mono text-foreground/70">Lifecycle actions:</p>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-primary font-mono">↑ Promote</span> — quality 3, no expiry. Preferred within this pool.
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-destructive font-mono">↓ Demote</span> — quality 1 and 7-day expiry.
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="text-destructive font-mono">🗑 Delete</span> — remove this pool row (does not delete user pauses or Library entries).
          </p>
        </div>
        <p className="text-[9px] text-muted-foreground/50">
          Badge <span className="text-primary">curated</span> here = score ≥3 in this table. That is unrelated to the Monitor “curated” serve counter (hardcoded fallbacks).
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          Also: <span className="text-secondary-foreground">good</span> = score 2, <span className="text-destructive">low</span> = score 1.
        </p>
        <p className="text-[9px] text-muted-foreground/55 leading-relaxed">
          <span className="font-mono text-secondary-foreground/90">Untrusted attribution</span> — keeps the cached body in the pool but makes the edge prefer other rows first when filling from cache (no delete).
        </p>
      </div>

      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Cache Entries <span className="text-muted-foreground/45">({entries.length})</span>
        </p>
      </button>

      {open && (
        <div className="space-y-3">
          <FilterRow label="Quality" options={QUALITY_OPTIONS} value={qualityFilter} onChange={setQualityFilter} />
          <FilterRow label="Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
          {(qualityFilter !== 'all' || statusFilter !== 'all') && (
            <p className="text-[9px] font-mono text-muted-foreground/40">Showing {filteredEntries.length} of {entries.length}</p>
          )}
          <AdminBulkBar
            idsShown={idsShown}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkDelete={bulkDelete}
            busy={bulkBusy}
          />
          {grouped.map(([type, items]) => (
            <div key={type} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] ?? 'hsl(var(--primary) / 0.4)' }} />
                <span className="text-[10px] font-mono text-foreground/80">{label(type)}</span>
                <span className="text-[9px] text-muted-foreground/50">{items.length} entries</span>
              </div>
              {items.map(entry => {
                const isPermanent = entry.expires_at === null;
                const isCurated = entry.quality_score >= 3;
                const isActing = acting === entry.id;
                return (
                  <div key={entry.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Checkbox
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={(v) => {
                          setSelectedIds((prev) => {
                            const n = new Set(prev);
                            if (v === true) n.add(entry.id);
                            else n.delete(entry.id);
                            return n;
                          });
                        }}
                        disabled={bulkBusy}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-foreground/70 truncate">{entry.title || '(untitled)'}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <QualityBadge score={entry.quality_score} />
                          {entry.source_untrusted && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground/90">
                              untrusted attr.
                            </span>
                          )}
                          {isPermanent && <span className="text-[9px] font-mono text-muted-foreground/40">♾ permanent</span>}
                          {!isPermanent && entry.expires_at && (
                            <span className="text-[9px] font-mono text-muted-foreground/30">
                              expires {new Date(entry.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[9px] text-muted-foreground/50">used: {entry.used_count}</span>
                      {(entry.thumbs_up != null || entry.thumbs_down != null) && (
                        <>
                          <span className="text-[9px] text-muted-foreground/50">👍 {entry.thumbs_up ?? 0}</span>
                          <span className="text-[9px] text-muted-foreground/50">👎 {entry.thumbs_down ?? 0}</span>
                        </>
                      )}
                      <span className="text-[9px] text-muted-foreground/45">{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {!isCurated && (
                        <button onClick={() => promote(entry.id)} disabled={isActing}
                          className="flex items-center gap-0.5 text-[9px] font-mono text-primary/70 hover:text-primary disabled:opacity-30 transition-colors">
                          <ArrowUp className="h-2.5 w-2.5" /> Promote
                        </button>
                      )}
                      {(isCurated || entry.quality_score >= 2) && (
                        <button onClick={() => demote(entry.id)} disabled={isActing}
                          className="flex items-center gap-0.5 text-[9px] font-mono text-destructive/70 hover:text-destructive disabled:opacity-30 transition-colors">
                          <ArrowDown className="h-2.5 w-2.5" /> Demote
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSourceUntrusted(entry.id, !entry.source_untrusted)}
                        disabled={isActing}
                        className="flex items-center gap-0.5 text-[9px] font-mono text-secondary-foreground/70 hover:text-secondary-foreground disabled:opacity-30 transition-colors"
                      >
                        {entry.source_untrusted ? 'Trust attribution' : 'Untrusted attribution'}
                      </button>
                      <button onClick={() => remove(entry.id)} disabled={isActing}
                        className="flex items-center gap-0.5 text-[9px] font-mono text-destructive/50 hover:text-destructive/80 disabled:opacity-30 transition-colors">
                        <Trash2 className="h-2.5 w-2.5" /> Delete
                      </button>
                      {isActing && <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground/30 ml-1" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">
              {entries.length === 0 ? 'No cache entries' : 'No entries match filters'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
