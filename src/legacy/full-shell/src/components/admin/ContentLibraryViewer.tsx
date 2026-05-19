import { useState, useMemo, useCallback, useEffect } from 'react';
import { Trash2, Loader2, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';
import type { LibraryEntryRow } from '@/lib/admin-stats-bundle-query';
import { Checkbox } from '@/components/ui/checkbox';
import { label } from './admin-constants';
import { FilterRow } from './FilterRow';
import { QualityBadge } from './QualityBadge';
import { AdminBulkBar } from './AdminBulkBar';
import { normalizeLibraryItemUrl } from '@/lib/library-item-url';
import { normalizeTitleKey, urlDedupCandidates } from '../../../supabase/functions/_shared/content-dedup.ts';

const UPDATE_CHUNK = 40;

const LIBRARY_TYPE_COLORS: Record<string, string> = {
  essay: 'hsl(var(--primary) / 0.8)',
  paper: 'hsl(var(--secondary-foreground) / 0.8)',
  event: 'hsl(var(--muted-foreground) / 0.8)',
  article: 'hsl(var(--accent-foreground) / 0.75)',
  book: 'hsl(var(--ring) / 0.8)',
  podcast: 'hsl(var(--destructive) / 0.7)',
};

export function ContentLibraryViewer({ entries, onRefresh }: { entries: LibraryEntryRow[]; onRefresh: () => void }) {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState<'essay' | 'paper' | 'event'>('essay');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCompanionTypes, setNewCompanionTypes] = useState('signal');
  const [newQuality, setNewQuality] = useState('2');
  const [newKeyQuote, setNewKeyQuote] = useState('');
  const [newCitation, setNewCitation] = useState('');
  const [newFinding, setNewFinding] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newAssetClass, setNewAssetClass] = useState('');
  const [newAnalogy, setNewAnalogy] = useState('');
  const [newRecovery, setNewRecovery] = useState('');
  const [newMoodTag, setNewMoodTag] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);

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

  const idsShown = useMemo(() => filtered.map((e) => e.id), [filtered]);

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

  const deleteEntry = useCallback(async (id: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from library?`)) return;
    setDeleting(id);
    const { error } = await supabase.from('content_library').update({ active: false }).eq('id', id);
    setDeleting(null);
    if (error) { toast({ title: 'Remove entry failed', description: error.message, variant: 'destructive' }); return; }
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    onRefresh();
  }, [onRefresh, toast]);

  const bulkDeactivate = useCallback(async () => {
    const ids = idsShown.filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!window.confirm(`Deactivate ${ids.length} library entr${ids.length === 1 ? 'y' : 'ies'}?`)) return;
    setBulkBusy(true);
    try {
      for (let i = 0; i < ids.length; i += UPDATE_CHUNK) {
        const slice = ids.slice(i, i + UPDATE_CHUNK);
        const { error } = await supabase.from('content_library').update({ active: false }).in('id', slice);
        if (error) {
          toast({ title: 'Bulk deactivate failed', description: error.message, variant: 'destructive' });
          setBulkBusy(false);
          return;
        }
      }
      setSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of ids) n.delete(id);
        return n;
      });
      onRefresh();
      toast({ title: 'Deactivated', description: `${ids.length} entr${ids.length === 1 ? 'y' : 'ies'} removed from the active library.` });
    } finally {
      setBulkBusy(false);
    }
  }, [idsShown, selectedIds, onRefresh, toast]);

  const resetAddForm = useCallback(() => {
    setNewType('essay');
    setNewTitle('');
    setNewAuthor('');
    setNewSummary('');
    setNewUrl('');
    setNewTags('');
    setNewCompanionTypes('signal');
    setNewQuality('2');
    setNewKeyQuote('');
    setNewCitation('');
    setNewFinding('');
    setNewEventDate('');
    setNewAssetClass('');
    setNewAnalogy('');
    setNewRecovery('');
    setNewMoodTag('');
    setPreviewBusy(false);
  }, []);

  const previewFromUrl = useCallback(async () => {
    const raw = newUrl.trim();
    if (!raw) {
      toast({ title: 'Enter a URL first', variant: 'destructive' });
      return;
    }
    const normalized = normalizeLibraryItemUrl(raw);
    setNewUrl(normalized);
    setPreviewBusy(true);
    const { data, error } = await invokeEdge<{
      error?: string;
      title?: string;
      author?: string | null;
      summary?: string;
      key_quote?: string | null;
      hint?: string;
    }>('admin-library-preview', {
      body: { url: normalized },
    });
    setPreviewBusy(false);
    if (error) {
      toast({ title: 'Preview failed', description: error.message, variant: 'destructive' });
      return;
    }
    if (data?.error) {
      toast({ title: 'Preview failed', description: data.error, variant: 'destructive' });
      return;
    }
    if (data?.title) setNewTitle(data.title);
    if (data?.author !== undefined) setNewAuthor(data.author ?? '');
    if (data?.summary) setNewSummary(data.summary);
    if (data?.key_quote && newType === 'essay') setNewKeyQuote(data.key_quote);
    if (data?.hint) {
      toast({ title: 'Preview (partial)', description: data.hint });
    } else {
      toast({ title: 'Filled from URL', description: 'Review title, author, and summary before saving.' });
    }
  }, [newUrl, newType, toast]);

  const addEntry = useCallback(async () => {
    if (!newTitle.trim() || !newSummary.trim()) return;

    const urlForRow = newUrl.trim() ? normalizeLibraryItemUrl(newUrl) : '';
    const titleNorm = normalizeTitleKey(newTitle);
    const urlCandidates = urlForRow ? urlDedupCandidates(urlForRow) : [];

    const { data: dupTitleRows } = await supabase
      .from('content_library')
      .select('id,title')
      .eq('title_norm', titleNorm)
      .eq('active', true)
      .limit(1);
    const dupTitle = dupTitleRows?.[0];

    let dupUrl: { id: string; title: string } | null = null;
    if (urlCandidates.length > 0) {
      const { data: dupUrlRows } = await supabase
        .from('content_library')
        .select('id,title')
        .eq('active', true)
        .in('url', urlCandidates)
        .limit(1);
      dupUrl = dupUrlRows?.[0] ?? null;
    }

    if (dupTitle || dupUrl) {
      const parts: string[] = [];
      if (dupTitle) parts.push(`same title as “${dupTitle.title}”`);
      if (dupUrl) parts.push(`same URL as “${dupUrl.title}”`);
      const ok = window.confirm(`Possible duplicate (${parts.join('; ')}). Add anyway?`);
      if (!ok) return;
    }

    const qualityParsed = parseInt(newQuality, 10);
    const qualityScore = Number.isNaN(qualityParsed) ? 2 : Math.max(1, Math.min(5, qualityParsed));
    const tags = newTags.split(',').map((s) => s.trim()).filter(Boolean);
    const companionTypes = newCompanionTypes.split(',').map((s) => s.trim()).filter(Boolean);

    const payload: Record<string, unknown> = {
      type: newType,
      title: newTitle.trim(),
      author: newAuthor.trim() || null,
      summary: newSummary.trim(),
      url: urlForRow || null,
      tags,
      companion_types: companionTypes,
      quality_score: qualityScore,
      language: 'en',
      active: true,
      key_quote: newType === 'essay' ? (newKeyQuote.trim() || null) : null,
      citation: newType === 'paper' ? (newCitation.trim() || null) : null,
      finding: newType === 'paper' ? (newFinding.trim() || null) : null,
      event_date: newType === 'event' ? (newEventDate.trim() || null) : null,
      asset_class: newType === 'event' ? (newAssetClass.trim() || null) : null,
      analogy: newType === 'event' ? (newAnalogy.trim() || null) : null,
      recovery: newType === 'event' ? (newRecovery.trim() || null) : null,
      mood_tag: newType === 'event' ? (newMoodTag.trim() || null) : null,
    };

    setSaving(true);
    const { error } = await supabase
      .from('content_library')
      .insert(payload as unknown as Database['public']['Tables']['content_library']['Insert']);
    setSaving(false);
    if (error) {
      toast({ title: 'Add library item failed', description: error.message, variant: 'destructive' });
      return;
    }
    resetAddForm();
    setAdding(false);
    onRefresh();
    toast({ title: 'Library item added' });
  }, [
    newTitle,
    newSummary,
    newQuality,
    newTags,
    newCompanionTypes,
    newType,
    newAuthor,
    newUrl,
    newKeyQuote,
    newCitation,
    newFinding,
    newEventDate,
    newAssetClass,
    newAnalogy,
    newRecovery,
    newMoodTag,
    onRefresh,
    resetAddForm,
    toast,
  ]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          DB-backed curated library — essays, papers, events tried <strong className="font-normal text-muted-foreground/65">first</strong> by generators (before <code className="text-muted-foreground/55">companion_cache</code>, before live AI, before hardcoded strings).
        </p>
        <p className="text-[9px] text-muted-foreground/50 leading-relaxed">
          This is where you edit the long-form “curated” content users can receive. Monitor’s per-serve “curated” count is mostly hardcoded fallbacks when both Library and cache miss — not this list directly. Entries align with Sources by author name where applicable. Deactivate sets <span className="font-mono">active = false</span>.
        </p>
      </div>

      {!adding ? (
        <button onClick={() => setAdding(true)} className="text-[10px] font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link transition-colors">
          + Add library item
        </button>
      ) : (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
          <div className="flex gap-2">
            <select value={newType} onChange={(e) => setNewType(e.target.value as 'essay' | 'paper' | 'event')} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5">
              <option value="essay">essay</option>
              <option value="paper">paper</option>
              <option value="event">event</option>
            </select>
            <input
              value={newQuality}
              onChange={(e) => setNewQuality(e.target.value)}
              placeholder="quality 1-5"
              className="w-24 text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title *" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="Author (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          <div className="flex flex-wrap items-end gap-2">
            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="min-w-[12rem] flex-1 text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40"
            />
            <button
              type="button"
              onClick={() => void previewFromUrl()}
              disabled={previewBusy || !newUrl.trim()}
              className="text-[10px] font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link disabled:opacity-30 shrink-0"
            >
              {previewBusy ? 'Fetching…' : 'Fill from URL'}
            </button>
          </div>
          <p className="text-[8px] text-muted-foreground/45 leading-relaxed">
            Fill from URL calls the <span className="font-mono">admin-library-preview</span> edge function (Firecrawl + optional Gemini via Lovable). You must be an admin; secrets match fetch-source-feeds.
          </p>
          <textarea value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Summary * (2-5 sentences)" rows={3} className="w-full text-[10px] font-mono bg-transparent border border-border/30 rounded px-2 py-1.5 outline-none placeholder:text-muted-foreground/40" />
          <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="tags (comma-separated, optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          <input value={newCompanionTypes} onChange={e => setNewCompanionTypes(e.target.value)} placeholder="companion_types (comma-separated, e.g. signal)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />

          {newType === 'essay' && (
            <input value={newKeyQuote} onChange={e => setNewKeyQuote(e.target.value)} placeholder="Key quote (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
          )}
          {newType === 'paper' && (
            <>
              <input value={newCitation} onChange={e => setNewCitation(e.target.value)} placeholder="Citation (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
              <input value={newFinding} onChange={e => setNewFinding(e.target.value)} placeholder="Finding (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
            </>
          )}
          {newType === 'event' && (
            <>
              <input value={newEventDate} onChange={e => setNewEventDate(e.target.value)} placeholder="Event date (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
              <input value={newAssetClass} onChange={e => setNewAssetClass(e.target.value)} placeholder="Asset class (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
              <input value={newAnalogy} onChange={e => setNewAnalogy(e.target.value)} placeholder="Analogy (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
              <input value={newRecovery} onChange={e => setNewRecovery(e.target.value)} placeholder="Recovery (optional)" className="w-full text-[10px] font-mono bg-transparent border-b border-border/30 pb-1 outline-none placeholder:text-muted-foreground/40" />
              <select value={newMoodTag} onChange={(e) => setNewMoodTag(e.target.value)} className="text-[10px] font-mono bg-transparent border border-border/30 rounded px-1.5 py-0.5 w-full">
                <option value="">mood_tag (optional)</option>
                <option value="recovery">recovery</option>
                <option value="caution">caution</option>
                <option value="neutral">neutral</option>
              </select>
            </>
          )}

          <div className="flex gap-2">
            <button onClick={addEntry} disabled={saving || !newTitle.trim() || !newSummary.trim()} className="text-[10px] font-sans font-medium text-nox-text-link hover:text-nox-text-link/80 disabled:opacity-30">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setPreviewBusy(false);
                setAdding(false);
                resetAddForm();
              }}
              className="text-[10px] font-mono text-muted-foreground/60 hover:text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <FilterRow label="Type" options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
      <p className="text-[9px] font-mono text-muted-foreground/50">
        {filtered.length === entries.length
          ? `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`
          : `Showing ${filtered.length} of ${entries.length} — `}
        {filtered.length < entries.length && (
          <button onClick={() => setTypeFilter('all')} className="text-xs font-sans font-medium text-nox-text-link/80 hover:text-nox-text-link">clear filter</button>
        )}
      </p>

      <AdminBulkBar
        idsShown={idsShown}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={bulkDeactivate}
        busy={bulkBusy}
        actionLabel="Deactivate selected"
      />

      <div className="space-y-1.5">
        {filtered.map(entry => {
          const isExpanded = expandedId === entry.id;
          const isDeleting = deleting === entry.id;
          return (
            <div key={entry.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  className="h-3.5 w-3.5 shrink-0"
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
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: LIBRARY_TYPE_COLORS[entry.type] ?? 'hsl(var(--muted-foreground) / 0.2)',
                    color: LIBRARY_TYPE_COLORS[entry.type] ?? 'hsl(var(--muted-foreground) / 0.8)',
                  }}>
                  {entry.type}
                </span>
                <button onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="text-[10px] font-mono text-foreground/80 truncate flex-1 min-w-0 text-left hover:text-nox-text-link transition-colors">
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
                    className="text-[9px] font-sans font-medium text-nox-text-link/70 hover:text-nox-text-link flex items-center gap-0.5 transition-colors">
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
                        <span key={ct} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{label(ct)}</span>
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
