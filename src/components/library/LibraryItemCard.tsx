import { Pin, PinOff, Trash2, ExternalLink, Tag, Eye, EyeOff, Archive } from 'lucide-react';
import type { LibraryItem } from '@/hooks/use-library';
import { useTranslation } from 'react-i18next';

const SOURCE_LABELS: Record<string, string> = {
  signal: 'Signal',
  learning: 'Learning',
  haiku: 'Haiku',
  zoom_out: 'Zoom Out',
  history_insight: 'History',
  external: 'External',
};

const TYPE_LABELS: Record<string, string> = {
  bookmark: '🔖',
  note: '📝',
  clipping: '✂️',
};

interface Props {
  item: LibraryItem;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LibraryItemCard({ item, onTogglePin, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="group rounded-md border border-border/40 bg-card/50 px-3 py-2.5 space-y-1.5 transition-colors hover:bg-card/80">
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{TYPE_LABELS[item.type] ?? '📄'}</span>
        <div className="flex-1 min-w-0">
          {item.title && (
            <p className="text-xs font-medium text-foreground leading-snug truncate">{item.title}</p>
          )}
          {item.body && (
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mt-0.5">
              {item.body}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onTogglePin(item.id)}
            className="p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
            aria-label={item.pinned ? t('common.unpin') : t('common.pinned')}
          >
            {item.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
            aria-label={t('common.delete')}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {item.pinned && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-primary/10 text-primary">
            pinned
          </span>
        )}
        {item.source_type && (
          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground">
            {SOURCE_LABELS[item.source_type] ?? item.source_type}
          </span>
        )}
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            link
          </a>
        )}
        {item.tags.length > 0 && item.tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.5 rounded bg-primary/5 text-primary/70">
            <Tag className="h-2 w-2" />{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
