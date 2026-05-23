import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight, Trash2, Globe, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  deleteSignalSourceRow,
  deleteSignalSourceRowsByIds,
  insertAdminSignalSource,
  setSignalSourceDemotedForLive,
} from '@/screens/admin/public-queries';
import type { LibraryEntryRow, SignalSourceRow } from '@/screens/admin/public-queries';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminBulkBar } from './AdminBulkBar';

const DELETE_CHUNK = 40;

const SOURCE_TYPE_COLORS: Record<string, string> = {
  blog: 'hsl(var(--primary) / 0.8)',
  podcast: 'hsl(var(--secondary-foreground) / 0.8)',
  book: 'hsl(var(--muted-foreground) / 0.8)',
  newsletter: 'hsl(var(--accent-foreground) / 0.75)',
  twitter: 'hsl(var(--ring) / 0.8)',
  video: 'hsl(var(--destructive) / 0.8)',
  /** RSS/Atom feed URL — fetch-source-feeds expands items → articles */
  rss: 'hsl(var(--primary) / 0.7)',
  feed: 'hsl(var(--primary) / 0.7)',
  /** Site root — Firecrawl Map discovers article URLs */
  site_map: 'hsl(var(--secondary-foreground) / 0.7)',
  site: 'hsl(var(--secondary-foreground) / 0.7)',
};

const CATEGORY_LABELS: Record<string, string> = {
  signal: 'Signal',
  grounding: 'Grounding',
};

export function SourceCatalogViewer({ sources, onRefresh, libraryEntries = [] }: {
  sources: SignalSourceRow[];
  onRefresh: () => void;
  libraryEntries?: LibraryEntryRow[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('blog');
  const [newCategory, setNewCategory] = useState('signal');
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, SignalSourceRow[]>();
    for (const s of sources) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [sources]);

  const idsShown = useMemo(() => sources.map((s) => s.id), [sources]);

  useEffect(() => {
    if (!open) setSelectedIds(new Set());
  }, [open]);

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

  const addSource = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { ok, errorMessage } = await insertAdminSignalSource({
      name: newName.trim(),
      url: newUrl.trim() || null,
      type: newType,
      category: newCategory,
    });
    setSaving(false);
    if (!ok) {
      toast({ title: 'Add source failed', description: errorMessage ?? 'Unknown error', variant: 'destructive' });
      return;
    }
    setNewName('');
    setNewUrl('');
    setAdding(false);
    onRefresh();
  };

  const deleteSource = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from sources?`)) return;
    const { ok, errorMessage } = await deleteSignalSourceRow(id);
    if (!ok) { toast({ title: 'Delete source failed', description: errorMessage ?? 'Unknown error', variant: 'destructive' }); return; }
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    onRefresh();
  };

  const setDemotedForLive = async (id: string, demoted: boolean) => {
    const { ok, errorMessage } = await setSignalSourceDemotedForLive(id, demoted);
    if (!ok) {
      toast({ title: 'Update failed', description: errorMessage ?? 'Unknown error', variant: 'destructive' });
      return;
    }
    onRefresh();
  };

  const bulkDeleteSources = useCallback(async () => {
    const ids = idsShown.filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} source${ids.length === 1 ? '' : 's'}?`)) return;
    setBulkBusy(true);
    try {
      const { deleted, errorMessage } = await deleteSignalSourceRowsByIds(ids, DELETE_CHUNK);
      if (errorMessage) {
        toast({ title: 'Bulk delete failed', description: errorMessage, variant: 'destructive' });
        return;
      }
      setSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
      onRefresh();
      toast({ title: 'Deleted', description: `${deleted} source${deleted === 1 ? '' : 's'} removed.` });
    } finally {
      setBulkBusy(false);
    }
  }, [idsShown, selectedIds, onRefresh, toast]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          Catalog for <strong className="font-normal text-muted-foreground/75">live</strong> generation: names/URLs the edge functions pass into web search (e.g. Perplexity) when building Signal and Grounding answers.
        </p>
        <p className="text-[9px] text-muted-foreground/55 leading-relaxed">
          This is <strong className="font-normal text-muted-foreground/65">not</strong> the <strong className="font-normal text-muted-foreground/65">Library</strong> tab. Library rows are full essays/papers/events matched by author for <strong className="font-normal text-muted-foreground/65">fallback</strong> when live generation does not produce a body. Sources here shape what the model can cite while it is still “live.”
        </p>
        <p className="text-[9px] text-muted-foreground/55 leading-relaxed">
          <span className="font-mono text-muted-foreground/70">rss</span> / <span className="font-mono text-muted-foreground/70">feed</span> — URL is an RSS or Atom feed; the source-feeds job pulls recent item links and ingests articles.{' '}
          <span className="font-mono text-muted-foreground/70">site_map</span> / <span className="font-mono text-muted-foreground/70">site</span> — URL is a site or section root; Firecrawl Map discovers pages, then we scrape article URLs. Otherwise one URL = one scrape (e.g. a single article).
        </p>
        <p className="text-[9px] text-muted-foreground/55 leading-relaxed">
          <span className="font-mono text-muted-foreground/70">Demoted from live</span> — row stays in the catalog but edge functions stop passing it into live web search until you restore it (no delete).
        </p>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground/60">
            <span className="font-mono font-medium">signal</span> — thinkers, essayists, publications (philosophical angle)
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            <span className="font-mono font-medium">grounding</span> — research-oriented / behavioral finance style sources
          </p>
        </div>
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="text-[10px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link transition-colors">
          + Add source
        </button>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Source name (e.g. Parker Lewis)"
            className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)}
            placeholder="URL (optional)"
            className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          <div className="flex gap-2">
            <select value={newType} onChange={e => setNewType(e.target.value)} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5">
              <option value="blog">blog</option>
              <option value="rss">rss (feed URL)</option>
              <option value="site_map">site_map (discover URLs)</option>
              <option value="book">book</option>
              <option value="podcast">podcast</option>
              <option value="essay">essay</option>
              <option value="academic">academic</option>
            </select>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5">
              <option value="signal">signal</option>
              <option value="grounding">grounding</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addSource} disabled={saving || !newName.trim()} className="text-[10px] font-sans font-medium text-nox-text-link hover:text-nox-text-link/80 disabled:opacity-30">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground">
              Cancel
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Source Catalog <span className="text-muted-foreground/45">({sources.length})</span>
        </p>
      </button>

      {open && (
        <div className="space-y-3">
          <AdminBulkBar
            idsShown={idsShown}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onBulkDelete={bulkDeleteSources}
            busy={bulkBusy}
          />
          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-1.5">
              <span className="text-[10px] font-mono text-foreground/80">{CATEGORY_LABELS[category] ?? category}</span>
              {items.map(src => {
                const libCount = libraryEntries.filter(le => le.author?.toLowerCase() === src.name.toLowerCase()).length;
                return (
                  <div key={src.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 flex items-center justify-between gap-2">
                    <Checkbox
                      className="h-3.5 w-3.5 shrink-0 self-start mt-0.5"
                      checked={selectedIds.has(src.id)}
                      onCheckedChange={(v) => {
                        setSelectedIds((prev) => {
                          const n = new Set(prev);
                          if (v === true) n.add(src.id);
                          else n.delete(src.id);
                          return n;
                        });
                      }}
                      disabled={bulkBusy}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-foreground/80 truncate">{src.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: SOURCE_TYPE_COLORS[src.type] ?? 'hsl(var(--muted-foreground) / 0.2)',
                            color: SOURCE_TYPE_COLORS[src.type] ?? 'hsl(var(--muted-foreground) / 0.8)',
                          }}>
                          {src.type}
                        </span>
                        {libCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                            <BookOpen className="h-2.5 w-2.5 inline mr-0.5" />{libCount} in library
                          </span>
                        )}
                        {src.demoted_for_live && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground/85">
                            demoted from live
                          </span>
                        )}
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer"
                            className="text-[9px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link flex items-center gap-0.5 truncate transition-colors">
                            <Globe className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{src.url.replace(/^https?:\/\//, '').slice(0, 40)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDemotedForLive(src.id, !src.demoted_for_live); }}
                        className="text-[9px] font-mono text-secondary-foreground/70 hover:text-secondary-foreground transition-colors text-right"
                      >
                        {src.demoted_for_live ? 'Restore to live' : 'Demote from live'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteSource(src.id, src.name); }}
                        className="text-destructive/40 hover:text-destructive transition-colors" title="Remove source"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {sources.length === 0 && (
            <p className="text-[10px] text-muted-foreground/50 text-center py-3">No sources configured</p>
          )}
        </div>
      )}
    </div>
  );
}
