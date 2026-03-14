import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LibraryItemCard } from './LibraryItemCard';
import { ItemDetailViewer } from './ItemDetailViewer';
import type { useLibrary } from '@/hooks/use-library';
import type { LibraryItem } from '@/hooks/use-library';
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  startOfDay,
} from 'date-fns';

interface Props {
  library: ReturnType<typeof useLibrary>;
  filtered: LibraryItem[];
}

interface DateGroup {
  key: string;
  label: string;
  items: LibraryItem[];
}

function groupByDate(items: LibraryItem[], t: (k: string) => string): DateGroup[] {
  const groups: Record<string, LibraryItem[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    earlier: [],
  };

  items.forEach((item) => {
    const date = new Date(item.created_at);
    if (isToday(date)) groups.today.push(item);
    else if (isYesterday(date)) groups.yesterday.push(item);
    else if (isThisWeek(date, { weekStartsOn: 1 })) groups.thisWeek.push(item);
    else if (isThisMonth(date)) groups.thisMonth.push(item);
    else groups.earlier.push(item);
  });

  const labels: Record<string, string> = {
    today: t('library.dateToday'),
    yesterday: t('library.dateYesterday'),
    thisWeek: t('library.dateThisWeek'),
    thisMonth: t('library.dateThisMonth'),
    earlier: t('library.dateEarlier'),
  };

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([key, items]) => ({ key, label: labels[key], items }));
}

export function LibraryItems({ library, filtered }: Props) {
  const { t } = useTranslation();
  const {
    items, collections, updateItem, deleteItem, togglePin, toggleFavorite,
    addToCollection, removeFromCollection, getItemCollections,
  } = library;

  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status } as any);
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await updateItem(id, { tags } as any);
  };

  // Build a map of reflection_id → linked companion items
  const linkedMap = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    items.forEach((i) => {
      if (i.reflection_id && i.source_type !== 'reflection') {
        const arr = map.get(i.reflection_id) ?? [];
        arr.push(i);
        map.set(i.reflection_id, arr);
      }
    });
    return map;
  }, [items]);

  // Keep selectedItem in sync with items state (e.g. after favorite toggle)
  const currentSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find((i) => i.id === selectedItem.id) ?? selectedItem;
  }, [selectedItem, items]);

  const selectedLinkedItems = useMemo(() => {
    if (!currentSelectedItem?.reflection_id || currentSelectedItem.source_type !== 'reflection') return undefined;
    return linkedMap.get(currentSelectedItem.reflection_id);
  }, [currentSelectedItem, linkedMap]);

  const handleSelectFromViewer = useCallback((item: LibraryItem) => {
    setSelectedItem(item);
  }, []);

  // Date-grouped sections
  const dateGroups = useMemo(() => groupByDate(filtered, t), [filtered, t]);

  // Pinned items shown at top, separately
  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedFiltered = filtered.filter((i) => !i.pinned);
  const unpinnedGroups = useMemo(() => groupByDate(unpinnedFiltered, t), [unpinnedFiltered, t]);

  const renderCard = (item: LibraryItem) => (
    <LibraryItemCard
      key={item.id}
      item={item}
      onToggleFavorite={toggleFavorite}
      onClick={() => setSelectedItem(item)}
    />
  );

  return (
    <>
      <div className="space-y-4">
        {pinnedItems.length > 0 && (
          <div className="space-y-0.5">
            <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider px-3 pb-1">
              📌 {t('common.pinned')}
            </p>
            <div className="divide-y divide-border/20">
              {pinnedItems.map(renderCard)}
            </div>
          </div>
        )}

        {unpinnedGroups.map((group) => (
          <div key={group.key} className="space-y-0.5">
            <p className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-wider px-3 pb-1">
              {group.label}
            </p>
            <div className="divide-y divide-border/20">
              {group.items.map(renderCard)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-12 font-mono">
            {t('library.emptyState')}
          </p>
        )}
      </div>

      <ItemDetailViewer
        item={currentSelectedItem}
        linkedItems={selectedLinkedItems}
        allItems={items}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleFavorite={toggleFavorite}
        onTogglePin={togglePin}
        onDelete={deleteItem}
        onStatusChange={handleStatusChange}
        onUpdateTags={handleUpdateTags}
        onSelectItem={handleSelectFromViewer}
        collections={collections}
        getItemCollections={getItemCollections}
        onAddToCollection={addToCollection}
        onRemoveFromCollection={removeFromCollection}
      />
    </>
  );
}
