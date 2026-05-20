import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RecentContentRow } from '@/features/pause/public-queries';
import { Checkbox } from '@/components/ui/checkbox';
import { TYPE_COLORS, label } from './admin-constants';
import { QualityBadge } from './QualityBadge';

type FeedCardProps = {
  item: RecentContentRow;
  selected?: boolean;
  onToggleSelect?: (id: string, checked: boolean) => void;
  selectDisabled?: boolean;
};

export function FeedCard({ item, selected, onToggleSelect, selectDisabled }: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const content = item.content as unknown;
  const body = typeof content === 'string'
    ? content
    : (content && typeof content === 'object' && typeof (content as { body?: unknown }).body === 'string')
      ? (content as { body: string }).body
      : JSON.stringify(content);

  const showSelect = Boolean(onToggleSelect);

  return (
    <div className="w-full rounded-lg border border-border/20 bg-card/10 transition-colors hover:bg-card/10">
      <div className="flex items-start gap-2 px-3 py-2">
        {showSelect && (
          <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              className="h-3.5 w-3.5"
              checked={!!selected}
              onCheckedChange={(v) => onToggleSelect?.(item.id, v === true)}
              disabled={selectDisabled}
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left space-y-1"
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: TYPE_COLORS[item.companion_type] ?? 'hsl(var(--muted-foreground) / 0.2)',
                color: TYPE_COLORS[item.companion_type] ?? 'hsl(var(--muted-foreground) / 0.8)',
              }}
            >
              {label(item.companion_type)}
            </span>
            <span className="text-[10px] font-mono text-foreground/80 truncate flex-1 min-w-0">
              {item.title || '(untitled)'}
            </span>
            <QualityBadge score={item.quality_score} />
            {expanded
              ? <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />
              : <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30 flex-shrink-0" />}
          </div>
          <p className="text-[9px] font-mono text-muted-foreground/40 truncate">
            {expanded ? body : body?.slice(0, 100)}{!expanded && (body?.length ?? 0) > 100 ? '…' : ''}
          </p>
          <div className="flex items-center gap-3">
            {item.source_author && <span className="text-[9px] text-muted-foreground/50">by {item.source_author}</span>}
            <span className="text-[9px] text-muted-foreground/45">{new Date(item.created_at).toLocaleDateString()}</span>
            <span className="text-[9px] text-muted-foreground/45">used: {item.used_count}</span>
          </div>
          {expanded && (
            <div className="pt-1 border-t border-border/5">
              <p className="text-[9px] font-mono text-foreground/40 whitespace-pre-wrap break-words">{body}</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
