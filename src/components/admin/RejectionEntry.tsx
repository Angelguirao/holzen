import { Clock } from 'lucide-react';
import type { RejectionRow } from '@/hooks/use-admin-stats';
import { TYPE_COLORS, label } from './admin-constants';

const STATUS_COLOR: Record<string, string> = {
  error: 'bg-red-500/15 text-red-600 dark:text-red-400',
  timeout: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  quality_gate_failed: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

export function RejectionEntry({ row }: { row: RejectionRow }) {
  return (
    <div className="rounded-lg border border-border/20 bg-card/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `${TYPE_COLORS[row.companion_type] ?? '#64748b'}20`,
            color: TYPE_COLORS[row.companion_type] ?? '#64748b',
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
