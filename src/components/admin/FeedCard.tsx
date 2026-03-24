import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RecentContentRow } from '@/hooks/use-admin-stats';
import { TYPE_COLORS, label } from './admin-constants';
import { QualityBadge } from './QualityBadge';

export function FeedCard({ item }: { item: RecentContentRow }) {
  const [expanded, setExpanded] = useState(false);
  const body = typeof item.content === 'string'
    ? item.content
    : typeof item.content?.body === 'string'
      ? item.content.body
      : JSON.stringify(item.content);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-lg border border-border/20 bg-card/10 px-3 py-2 space-y-1 transition-colors hover:bg-card/10"
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: `${TYPE_COLORS[item.companion_type] ?? '#64748b'}20`,
            color: TYPE_COLORS[item.companion_type] ?? '#64748b',
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
  );
}
