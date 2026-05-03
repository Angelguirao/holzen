import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, Loader2, Plus, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
const POOL_LABELS: Record<FallbackPoolType, string> = {
  signal: 'Signal',
  grounding: 'Grounding',
  history: 'Historical echo',
  zoom_out: 'Zoom Out (deep time)',
  reflection: 'Reflection (pause)',
};
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export type FallbackPoolType = 'signal' | 'grounding' | 'history' | 'zoom_out' | 'reflection';

export interface CompanionFallbackRow {
  id: string;
  pool_type: FallbackPoolType;
  sort_order: number;
  payload: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const POOL_ORDER: FallbackPoolType[] = ['signal', 'grounding', 'history', 'zoom_out', 'reflection'];

const POOL_HELP: Record<FallbackPoolType, string> = {
  signal: 'Last resort when Library + cache miss (Signal card). Fields: title, body, source, url.',
  grounding: 'Grounding nudge. Fields: title, body, citation, url.',
  history: 'Historical echo. Fields: title, btcInsight, analogy, assetClass, period, source?, url?.',
  zoom_out: 'Deep-time zoom. Fields: title, body.',
  reflection: 'holzen-reflect when AI unavailable. Fields: message, haiku.',
};

function previewLine(pool: FallbackPoolType, payload: Record<string, unknown>): string {
  const t = payload.title ?? payload.message;
  if (typeof t === 'string' && t.trim()) return t.slice(0, 120) + (t.length > 120 ? '…' : '');
  return '(untitled)';
}

export function HardcodedFallbacksManager({ onRefresh }: { onRefresh?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<CompanionFallbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<CompanionFallbackRow | null>(null);
  const [editJson, setEditJson] = useState('');
  const [addPool, setAddPool] = useState<FallbackPoolType | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companion_fallbacks')
      .select('id, pool_type, sort_order, payload, is_active, created_at, updated_at')
      .order('pool_type', { ascending: true })
      .order('sort_order', { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load fallbacks', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((data ?? []) as CompanionFallbackRow[]);
  }, [toast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const byPool = useMemo(() => {
    const m = new Map<FallbackPoolType, CompanionFallbackRow[]>();
    for (const p of POOL_ORDER) m.set(p, []);
    for (const r of rows) {
      const list = m.get(r.pool_type as FallbackPoolType);
      if (list) list.push(r as CompanionFallbackRow);
    }
    return m;
  }, [rows]);

  const savePayload = async (row: CompanionFallbackRow, payload: Record<string, unknown>) => {
    setActing(row.id);
    const { error } = await supabase
      .from('companion_fallbacks')
      .update({ payload: payload as Json, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setActing(null);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved' });
    await fetchRows();
    onRefresh?.();
  };

  const toggleActive = async (row: CompanionFallbackRow) => {
    setActing(row.id);
    const { error } = await supabase
      .from('companion_fallbacks')
      .update({ is_active: !row.is_active, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    setActing(null);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchRows();
    onRefresh?.();
  };

  const remove = async (row: CompanionFallbackRow) => {
    if (!window.confirm('Delete this fallback entry? Generation will use bundled file seed if the pool becomes empty.')) return;
    setActing(row.id);
    const { error } = await supabase.from('companion_fallbacks').delete().eq('id', row.id);
    setActing(null);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted' });
    await fetchRows();
    onRefresh?.();
  };

  const swapOrder = async (pool: FallbackPoolType, index: number, dir: -1 | 1) => {
    const list = byPool.get(pool) ?? [];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    setActing('reorder');
    const { error: e1 } = await supabase.from('companion_fallbacks').update({ sort_order: b.sort_order }).eq('id', a.id);
    const { error: e2 } = await supabase.from('companion_fallbacks').update({ sort_order: a.sort_order }).eq('id', b.id);
    setActing(null);
    if (e1 || e2) {
      toast({ title: 'Reorder failed', description: (e1 ?? e2)?.message ?? 'Unknown', variant: 'destructive' });
      return;
    }
    await fetchRows();
    onRefresh?.();
  };

  const addEntry = async (pool: FallbackPoolType) => {
    const list = byPool.get(pool) ?? [];
    const nextOrder = list.length > 0 ? Math.max(...list.map((r) => r.sort_order)) + 1 : 0;
    const templates: Record<FallbackPoolType, Record<string, unknown>> = {
      signal: { title: '', body: '', source: '', url: '' },
      grounding: { title: '', body: '', citation: '', url: '' },
      history: { title: '', btcInsight: '', analogy: '', assetClass: '', period: '', source: '', url: '' },
      zoom_out: { title: '', body: '' },
      reflection: { message: '', haiku: '' },
    };
    setActing('new');
    const { error } = await supabase.from('companion_fallbacks').insert({
      pool_type: pool,
      sort_order: nextOrder,
      payload: templates[pool] as Json,
      is_active: true,
    });
    setActing(null);
    if (error) {
      toast({ title: 'Add failed', description: error.message, variant: 'destructive' });
      return;
    }
    setAddPool(null);
    toast({ title: 'Entry added' });
    await fetchRows();
    onRefresh?.();
  };

  const openEdit = (row: CompanionFallbackRow) => {
    setEditRow(row);
    setEditJson(JSON.stringify(row.payload, null, 2));
  };

  const saveEdit = async () => {
    if (!editRow) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(editJson) as Record<string, unknown>;
    } catch (e) {
      toast({ title: 'Invalid JSON', description: String(e), variant: 'destructive' });
      return;
    }
    await savePayload(editRow, parsed);
    setEditRow(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/20 bg-card/10 px-4 py-3 space-y-2">
        <p className="text-[10px] font-mono text-foreground/70">
          <strong className="font-normal text-muted-foreground/65">Hardcoded fallbacks</strong> — last resort when live AI and Library + cache miss. Edge functions load these rows from{' '}
          <code className="text-muted-foreground/55">companion_fallbacks</code>; if a pool has no active rows, the bundled{' '}
          <code className="text-muted-foreground/55">fallback-seed.json</code> is used.
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          Monitor &quot;curated&quot; serve counts refer to this path. Edits apply on the next generation (no deploy). Invalid JSON is rejected on save.
        </p>
      </div>

      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full text-left">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground/60" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Hardcoded pools <span className="text-muted-foreground/45">({rows.length})</span>
        </p>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[9px] font-mono ml-auto" onClick={(e) => { e.stopPropagation(); fetchRows(); }} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
        </Button>
      </button>

      {open && (
        <div className="space-y-4">
          {POOL_ORDER.map((pool) => {
            const list = byPool.get(pool) ?? [];
            return (
              <div key={pool} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary/40" />
                    <span className="text-[10px] font-mono text-foreground/80">{POOL_LABELS[pool]}</span>
                    <span className="text-[9px] text-muted-foreground/45">{list.length} entries</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddPool(pool)}
                    className="text-[9px] font-sans font-medium text-nox-text-link/75 hover:text-nox-text-link flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/50 pl-4">{POOL_HELP[pool]}</p>
                {list.map((row, idx) => {
                  const busy = acting === row.id || acting === 'reorder';
                  return (
                    <div key={row.id} className="rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-mono truncate ${row.is_active ? 'text-foreground/80' : 'text-muted-foreground/40 line-through'}`}>
                            {previewLine(pool, row.payload)}
                          </p>
                          <p className="text-[9px] text-muted-foreground/35 font-mono">order {row.sort_order}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleActive(row)}
                            disabled={!!acting}
                            className="p-1 text-muted-foreground/40 hover:text-foreground"
                            title={row.is_active ? 'Disable' : 'Enable'}
                          >
                            {row.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                          <button type="button" onClick={() => swapOrder(pool, idx, -1)} disabled={idx === 0 || !!acting} className="p-1 text-muted-foreground/40 hover:text-foreground disabled:opacity-20" title="Move up">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => swapOrder(pool, idx, 1)} disabled={idx >= list.length - 1 || !!acting} className="p-1 text-muted-foreground/40 hover:text-foreground disabled:opacity-20" title="Move down">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => openEdit(row)} disabled={!!acting} className="p-1 text-muted-foreground/50 hover:text-nox-text-link">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => remove(row)} disabled={!!acting} className="p-1 text-destructive/40 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/30" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <p className="text-[9px] text-muted-foreground/45 pl-2">No DB rows — edge uses file seed for this pool.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editRow} onOpenChange={(v) => { if (!v) setEditRow(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xs font-mono">Edit payload (JSON)</DialogTitle>
          </DialogHeader>
          <Textarea value={editJson} onChange={(e) => setEditJson(e.target.value)} className="font-mono text-[10px] min-h-[240px]" />
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button type="button" size="sm" onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addPool !== null} onOpenChange={(v) => { if (!v) setAddPool(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xs font-mono">Add entry</DialogTitle>
          </DialogHeader>
          <p className="text-[10px] text-muted-foreground/70">Create a new row in pool <code className="font-mono">{addPool}</code> with empty template fields?</p>
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setAddPool(null)}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => addPool && addEntry(addPool)} disabled={acting === 'new'}>
              {acting === 'new' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
