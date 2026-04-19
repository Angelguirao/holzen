import { useMemo } from 'react';
import { Heart, Pause, Radio, Leaf, Feather, Telescope, ScrollText, Pencil, Link as LinkIcon, FileText, type LucideIcon } from 'lucide-react';
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
  grounding: '🌿',
  learning: '🌿',
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

// HSL-based color accents per source type (uses design system hues)
const SOURCE_COLORS: Record<string, string> = {
  reflection: 'border-l-primary/40',
  signal: 'border-l-[hsl(200,50%,50%)]/40',
  grounding: 'border-l-[hsl(150,40%,45%)]/40',
  learning: 'border-l-[hsl(150,40%,45%)]/40',
  haiku: 'border-l-[hsl(280,40%,55%)]/40',
  zoom_out: 'border-l-[hsl(30,50%,50%)]/40',
  history_insight: 'border-l-[hsl(45,60%,50%)]/40',
  reflection_note: 'border-l-muted-foreground/30',
  external: 'border-l-[hsl(210,30%,50%)]/40',
  ground: 'border-l-[hsl(140,40%,40%)]/40',
  practice: 'border-l-[hsl(260,40%,50%)]/40',
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

  const meta = SOURCE_META[item.source_type ?? ''] ?? { icon: FileText, label: item.type ?? 'Item' };
  const CategoryIcon = meta.icon;
  const isCompanion = item.source_type && !['reflection', 'reflection_note', 'ground', 'practice', 'external'].includes(item.source_type);
  // Only show as skipped if the pause is complete (has outcome) and user didn't engage
  const dimmed = isCompanion && !engaged && !incomplete;

  const sourceColor = SOURCE_COLORS[item.source_type ?? ''] ?? 'border-l-transparent';

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 rounded-lg border-l-2 px-3 py-2.5 transition-colors hover:bg-card/80 cursor-pointer mb-0 pb-[16px] pt-[16px]',
        sourceColor,
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
          {incomplete && (
            <span className="shrink-0 text-[8px] font-mono text-destructive/60 uppercase tracking-wider">incomplete</span>
          )}
          {dimmed && (
            <span className="text-[8px] font-mono text-muted-foreground/40 uppercase tracking-wider">skipped</span>
          )}
        </div>
        {preview && (
          <p className="leading-relaxed line-clamp-2 font-sans text-sm text-secondary-foreground">
            {item.source_type === 'haiku' ? (
              <span className="italic">{preview}</span>
            ) : preview}
          </p>
        )}
        <p className="text-muted-foreground/35 pt-0.5 text-sm font-sans">{timeAgo}</p>
      </div>

      <button
        onClick={() => onToggleFavorite(item.id)}
        className={`p-1 mt-0.5 shrink-0 transition-colors ${item.is_favorite ? 'text-primary' : 'text-muted-foreground/40'}`}
        aria-label={item.is_favorite ? t('libraryCard.removeFavorite') : t('libraryCard.addFavorite')}
      >
        <Heart className={`h-3.5 w-3.5 ${item.is_favorite ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}
