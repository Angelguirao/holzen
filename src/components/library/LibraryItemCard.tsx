import { useMemo } from 'react';
import { Heart } from 'lucide-react';
import type { LibraryItem } from '@/hooks/use-library';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  item: LibraryItem;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
  engaged?: boolean;
  incomplete?: boolean;
}

const SOURCE_EMOJIS: Record<string, string> = {
  reflection: '⏸',
  signal: '📡',
  learning: '📖',
  haiku: '🍃',
  zoom_out: '🔭',
  history_insight: '📜',
  reflection_note: '✏️',
  external: '🔗',
  ground: '🌿',
  practice: '🧘',
};

const TYPE_LABELS: Record<string, string> = {
  bookmark: '🔖',
  note: '📝',
  clipping: '✂️',
};

export function LibraryItemCard({ item, onToggleFavorite, onClick, engaged = true, incomplete = false }: Props) {
  const { t } = useTranslation();

  const preview = useMemo(() => {
    if (!item.body) return null;
    let text = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);
    if (item.source_type === 'zoom_out' && text.startsWith('{')) {
      try {
        const parsed = JSON.parse(text);
        text = parsed?.deepTime?.body || parsed?.echo?.message || parsed?.deepTime?.title || 'Zoom Out';
      } catch {}
    }
    return text.length > 120 ? text.slice(0, 120) + '…' : text;
  }, [item.body, item.source_type]);

  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.created_at), { addSuffix: true });
    } catch {
      return '';
    }
  }, [item.created_at]);

  const isNew = useMemo(() => {
    try {
      return differenceInHours(new Date(), new Date(item.created_at)) < 24 && item.status === 'unread';
    } catch {
      return false;
    }
  }, [item.created_at, item.status]);

  const emoji = SOURCE_EMOJIS[item.source_type ?? ''] ?? TYPE_LABELS[item.type] ?? '📄';
  const isCompanion = item.source_type && !['reflection', 'reflection_note', 'ground', 'practice', 'external'].includes(item.source_type);
  const dimmed = isCompanion && !engaged;

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-card/80 cursor-pointer',
        dimmed && 'opacity-40'
      )}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onClick?.();
      }}
    >
      <span className="text-sm mt-0.5 shrink-0">{emoji}</span>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          {item.title && item.title !== 'Reflection' && (
            <p className="text-xs font-medium text-foreground leading-snug truncate">{item.title}</p>
          )}
          {isNew && (
            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-primary" />
          )}
          {dimmed && (
            <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">skipped</span>
          )}
        </div>
        {preview && (
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2">
            {item.source_type === 'haiku' ? (
              <span className="italic">{preview}</span>
            ) : preview}
          </p>
        )}
        <p className="text-[9px] font-mono text-muted-foreground/35 pt-0.5">{timeAgo}</p>
      </div>

      <button
        onClick={() => onToggleFavorite(item.id)}
        className={`p-1 mt-0.5 shrink-0 transition-colors ${item.is_favorite ? 'text-destructive' : 'text-muted-foreground/20 opacity-0 group-hover:opacity-100'}`}
        aria-label={item.is_favorite ? t('libraryCard.removeFavorite') : t('libraryCard.addFavorite')}
      >
        <Heart className={`h-3.5 w-3.5 ${item.is_favorite ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
