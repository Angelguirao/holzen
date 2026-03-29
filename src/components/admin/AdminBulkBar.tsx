import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Trash2 } from 'lucide-react';

type Props = {
  /** IDs currently visible (e.g. after filters) — "select all" applies to these only */
  idsShown: string[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onBulkDelete: () => void | Promise<void>;
  busy?: boolean;
  /** e.g. "Delete" vs "Deactivate" */
  actionLabel?: string;
};

/**
 * Select-all-visible + bulk action bar for admin lists.
 */
export function AdminBulkBar({
  idsShown,
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  busy,
  actionLabel = 'Delete selected',
}: Props) {
  const selectedInView = idsShown.filter((id) => selectedIds.has(id));
  const allSelected = idsShown.length > 0 && selectedInView.length === idsShown.length;
  const someInView = selectedInView.length > 0;

  const setAllShown = (select: boolean) => {
    const next = new Set(selectedIds);
    if (select) {
      for (const id of idsShown) next.add(id);
    } else {
      for (const id of idsShown) next.delete(id);
    }
    onSelectionChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-2.5 rounded-lg border border-border/20 bg-muted/15">
      <label className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground/75 cursor-pointer select-none">
        <Checkbox
          disabled={idsShown.length === 0 || busy}
          checked={allSelected ? true : someInView ? 'indeterminate' : false}
          onCheckedChange={(v) => {
            if (v === true) setAllShown(true);
            else setAllShown(false);
          }}
          className="h-3.5 w-3.5"
        />
        <span>
          Select all shown <span className="text-muted-foreground/45">({idsShown.length})</span>
        </span>
      </label>
      {someInView && (
        <>
          <span className="text-[9px] font-mono text-muted-foreground/50 border-l border-border/30 pl-2">
            {selectedInView.length} selected
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const next = new Set(selectedIds);
              for (const id of idsShown) next.delete(id);
              onSelectionChange(next);
            }}
            className="text-[9px] font-mono text-muted-foreground/60 hover:text-foreground disabled:opacity-40"
          >
            Clear on page
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onBulkDelete()}
            className="inline-flex items-center gap-1 text-[9px] font-mono text-destructive/70 hover:text-destructive disabled:opacity-40 ml-auto"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            {actionLabel}
          </button>
        </>
      )}
    </div>
  );
}
