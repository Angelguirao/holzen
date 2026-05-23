import { Clock } from 'lucide-react';
import type { RejectionRow } from '@/screens/admin/public-queries';
import { Checkbox } from '@/components/ui/checkbox';
import { TYPE_COLORS, label } from './admin-constants';

const STATUS_COLOR: Record<string, string> = {
  error: 'bg-destructive/15 text-destructive',
  timeout: 'bg-secondary text-secondary-foreground',
  quality_gate_failed: 'bg-muted/50 text-foreground',
};

type RejectionEntryProps = {
  row: RejectionRow;
  selected?: boolean;
  onToggleSelect?: (id: string, checked: boolean) => void;
  selectDisabled?: boolean;
};

export function RejectionEntry({ row, selected, onToggleSelect, selectDisabled }: RejectionEntryProps) {
  const showSelect = Boolean(onToggleSelect);
  return (
    <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
      <div className="flex items-center gap-2">
        {showSelect && (
          <Checkbox
            className="h-3.5 w-3.5 shrink-0"
            checked={!!selected}
            onCheckedChange={(v) => onToggleSelect?.(row.id, v === true)}
            disabled={selectDisabled}
          />
        )}
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: TYPE_COLORS[row.companion_type] ?? 'hsl(var(--muted-foreground) / 0.2)',
            color: TYPE_COLORS[row.companion_type] ?? 'hsl(var(--muted-foreground) / 0.8)',
          }}
        >
          {label(row.companion_type)}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground/30">{row.model}</span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${STATUS_COLOR[row.status] ?? 'bg-muted/20 text-muted-foreground/40'}`}>
          {row.status}
        </span>
        <span className="text-[9px] text-muted-foreground/45 ml-auto flex-shrink-0">
          {new Date(row.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[9px] font-mono text-muted-foreground/40 truncate">
          {row.quality_gate_reason || row.error_message || '—'}
        </span>
        {row.latency_ms != null && (
          <span className="text-[9px] text-muted-foreground/50 flex-shrink-0 flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" /> {(row.latency_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}
