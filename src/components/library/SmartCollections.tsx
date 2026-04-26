import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LibraryItem } from '@/hooks/use-library';
import { isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface SmartCollection {
  id: string;
  name: string;
  emoji: string;
  description: string;
  items: LibraryItem[];
}

interface Props {
  items: LibraryItem[];
  onSelect: (collection: SmartCollection) => void;
  isReflectionIncomplete?: (item: LibraryItem) => boolean;
}

export function SmartCollections({ items, onSelect, isReflectionIncomplete }: Props) {
  const { t } = useTranslation();

  const activeItems = useMemo(
    () => items.filter((i) => i.status !== 'deleted' && i.status !== 'archived'),
    [items]
  );

  const smartCollections = useMemo<SmartCollection[]>(() => {
    const collections: SmartCollection[] = [];

    // Decisions without outcome — actually checks reflection completeness
    if (isReflectionIncomplete) {
      const noOutcome = activeItems.filter(
        (i) => i.source_type === 'pause' && isReflectionIncomplete(i)
      );
      if (noOutcome.length > 0) {
        collections.push({
          id: 'smart_no_outcome',
          name: t('library.smartNoOutcome', { defaultValue: 'No outcome yet' }),
          emoji: '⏳',
          description: t('library.smartNoOutcomeDesc', {
            defaultValue: `${noOutcome.length} pauses awaiting a decision`,
            count: noOutcome.length,
          }),
          items: noOutcome,
        });
      }
    }

    // This week's highlights
    const thisWeek = activeItems.filter((i) => {
      try { return isThisWeek(new Date(i.created_at), { weekStartsOn: 1 }); } catch { return false; }
    });
    if (thisWeek.length > 0) {
      collections.push({
        id: 'smart_this_week',
        name: t('library.smartThisWeek', { defaultValue: 'This week' }),
        emoji: '📅',
        description: t('library.smartThisWeekDesc', { defaultValue: `${thisWeek.length} items from this week` }),
        items: thisWeek,
      });
    }

    // Favorites (quick access)
    const favorites = activeItems.filter((i) => i.is_favorite);
    if (favorites.length > 0) {
      collections.push({
        id: 'smart_favorites',
        name: t('library.smartFavorites', { defaultValue: 'Favorites' }),
        emoji: '❤️',
        description: t('library.smartFavoritesDesc', { defaultValue: `${favorites.length} saved favorites` }),
        items: favorites,
      });
    }

    // Pinned items
    const pinned = activeItems.filter((i) => i.pinned);
    if (pinned.length > 0) {
      collections.push({
        id: 'smart_pinned',
        name: t('library.smartPinned', { defaultValue: 'Pinned' }),
        emoji: '📌',
        description: t('library.smartPinnedDesc', { defaultValue: `${pinned.length} pinned items` }),
        items: pinned,
      });
    }

    return collections;
  }, [activeItems, t, isReflectionIncomplete]);

  if (smartCollections.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider px-1">
        {t('library.smartCollectionsLabel', { defaultValue: 'Smart collections' })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {smartCollections.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onSelect(sc)}
            className={cn(
              'text-left rounded-lg border border-border/30 p-3 space-y-1 transition-colors',
              'hover:bg-card/80 hover:border-border/50'
            )}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{sc.emoji}</span>
              <span className="text-[10px] font-mono font-medium text-foreground truncate">{sc.name}</span>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground/50 line-clamp-1">{sc.description}</p>
            <span className="text-[9px] font-mono text-muted-foreground/30">{sc.items.length} items</span>
          </button>
        ))}
      </div>
    </div>
  );
}
