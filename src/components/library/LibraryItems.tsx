import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LibraryItemCard } from './LibraryItemCard';
import { ItemDetailViewer } from './ItemDetailViewer';
import type { useLibrary } from '@/hooks/use-library';
import type { LibraryItem } from '@/hooks/use-library';
import { Trash2, Archive, Heart, X, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
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
    addToCollection, removeFromCollection, getItemCollections, isCompanionEngaged, isReflectionIncomplete,
  } = library;

  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  }, [filtered]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await Promise.all(Array.from(selectedIds).map((id) => deleteItem(id)));
    setBulkLoading(false);
    exitSelectMode();
  }, [selectedIds, deleteItem, exitSelectMode]);

  const handleBulkArchive = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await Promise.all(
      Array.from(selectedIds).map((id) => updateItem(id, { status: 'archived' } as any))
    );
    setBulkLoading(false);
    exitSelectMode();
  }, [selectedIds, updateItem, exitSelectMode]);

  const handleBulkFavorite = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await Promise.all(
      Array.from(selectedIds).map((id) => updateItem(id, { is_favorite: true } as any))
    );
    setBulkLoading(false);
    exitSelectMode();
  }, [selectedIds, updateItem, exitSelectMode]);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status } as any);
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await updateItem(id, { tags } as any);
  };

  const linkedMap = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    items.forEach((i) => {
      if (i.reflection_id && i.source_type !== 'reflection' && i.status !== 'deleted') {
        const arr = map.get(i.reflection_id) ?? [];
        arr.push(i);
        map.set(i.reflection_id, arr);
      }
    });
    return map;
  }, [items]);

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

  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedFiltered = filtered.filter((i) => !i.pinned);
  const unpinnedGroups = useMemo(() => groupByDate(unpinnedFiltered, t), [unpinnedFiltered, t]);

  const renderCard = (item: LibraryItem) => (
    <div key={item.id} className="flex items-center">
      {selectMode && (
        <button
          onClick={() => toggleSelect(item.id)}
          className={cn(
            'shrink-0 w-5 h-5 rounded border flex items-center justify-center ml-2 mr-0.5 transition-colors',
            selectedIds.has(item.id)
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-border/60 text-transparent hover:border-muted-foreground/40'
          )}
        >
          {selectedIds.has(item.id) && (
            <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <LibraryItemCard
          item={item}
          onToggleFavorite={selectMode ? () => toggleSelect(item.id) : toggleFavorite}
          engaged={isCompanionEngaged(item)}
          incomplete={isReflectionIncomplete(item)}
          onClick={() => {
            if (selectMode) {
              toggleSelect(item.id);
            } else {
              setSelectedItem(item);
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Select mode toggle + bulk action bar */}
      <div className="flex items-center justify-between px-1 min-h-[28px]">
        {selectMode ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={exitSelectMode}
              className="p-1 text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-mono text-muted-foreground/70">
              {selectedIds.size} {t('library.selected', { defaultValue: 'selected' })}
            </span>
            <button
              onClick={selectAll}
              className="text-[10px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              {t('library.selectAll', { defaultValue: 'Select all' })}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleBulkFavorite}
              disabled={bulkLoading || selectedIds.size === 0}
              className="p-1.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors"
              title={t('library.bulkFavorite', { defaultValue: 'Favorite' })}
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleBulkArchive}
              disabled={bulkLoading || selectedIds.size === 0}
              className="p-1.5 text-muted-foreground/50 hover:text-foreground disabled:opacity-30 transition-colors"
              title={t('library.bulkArchive', { defaultValue: 'Archive' })}
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkLoading || selectedIds.size === 0}
              className="p-1.5 text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors"
              title={t('library.bulkDelete', { defaultValue: 'Delete' })}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          filtered.length > 0 && (
            <button
              onClick={enterSelectMode}
              className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-auto"
            >
              <CheckSquare className="h-3 w-3" />
              {t('library.select', { defaultValue: 'Select' })}
            </button>
          )
        )}
      </div>

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
        open={!!selectedItem && !selectMode}
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
