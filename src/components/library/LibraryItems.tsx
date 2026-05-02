import { useMemo, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GroupedVirtuoso, Virtuoso } from 'react-virtuoso';
import { LibraryItemCard } from './LibraryItemCard';
import { ItemDetailViewer } from './ItemDetailViewer';
import { SwipeableCard } from './SwipeableCard';
import { ExportMenu } from './ExportMenu';
import type { useLibrary } from '@/hooks/use-library';
import type { LibraryItem } from '@/hooks/use-library';
import { Link } from 'react-router-dom';
import { Trash2, Archive, Heart, X, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isMainPauseLibraryBookmark } from '@/lib/normalize-library-source-type';
import type { PauseInstanceArchiveMeta } from '@/lib/archive-segment';
import {
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  format,
  startOfDay,
} from 'date-fns';

export type LibraryDateGroupStyle = 'relativeBuckets' | 'calendarDay';

interface Props {
  library: ReturnType<typeof useLibrary>;
  filtered: LibraryItem[];
  /** Default `calendarDay` matches Archive wireframes (Today + dd/MM/yy). */
  dateGroupStyle?: LibraryDateGroupStyle;
  /** Echoes tab: simpler “Reflection” labeling on cards. */
  echoesPresentation?: boolean;
  emptyStateMessage?: string;
  emptyStateHint?: string;
  emptyCtaLabel?: string;
  emptyCtaTo?: string;
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

function groupByCalendarDay(items: LibraryItem[], t: (k: string) => string): DateGroup[] {
  const buckets = new Map<number, LibraryItem[]>();
  items.forEach((item) => {
    const day = startOfDay(new Date(item.created_at)).getTime();
    const arr = buckets.get(day) ?? [];
    arr.push(item);
    buckets.set(day, arr);
  });
  const keys = [...buckets.keys()].sort((a, b) => b - a);
  return keys.map((ts) => {
    const d = new Date(ts);
    const label = isToday(d) ? t('library.dateToday') : format(d, 'dd/MM/yy');
    return { key: String(ts), label, items: buckets.get(ts)! };
  });
}

export function LibraryItems({
  library,
  filtered,
  dateGroupStyle = 'calendarDay',
  echoesPresentation = false,
  emptyStateMessage,
  emptyStateHint,
  emptyCtaLabel,
  emptyCtaTo,
}: Props) {
  const { t } = useTranslation();
  const {
    items, collections, updateItem, deleteItem, togglePin, toggleFavorite,
    addToCollection, removeFromCollection, getItemCollections, isCompanionEngaged, isReflectionIncomplete,
    getReflectionOutcome,
    getPauseArchiveMeta,
    refetch,
    loading,
    listLoadFailed,
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
      Array.from(selectedIds).map((id) => updateItem(id, { status: 'archived' }))
    );
    setBulkLoading(false);
    exitSelectMode();
  }, [selectedIds, updateItem, exitSelectMode]);

  const handleBulkFavorite = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    await Promise.all(
      Array.from(selectedIds).map((id) => updateItem(id, { is_favorite: true }))
    );
    setBulkLoading(false);
    exitSelectMode();
  }, [selectedIds, updateItem, exitSelectMode]);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status });
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await updateItem(id, { tags });
  };

  const linkedMap = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    items.forEach((i) => {
      if (i.pause_instance_id && !isMainPauseLibraryBookmark(i.source_type) && i.status !== 'deleted') {
        const arr = map.get(i.pause_instance_id) ?? [];
        arr.push(i);
        map.set(i.pause_instance_id, arr);
      }
    });
    return map;
  }, [items]);

  const currentSelectedItem = useMemo(() => {
    if (!selectedItem) return null;
    return items.find((i) => i.id === selectedItem.id) ?? selectedItem;
  }, [selectedItem, items]);

  const selectedLinkedItems = useMemo(() => {
    if (!currentSelectedItem?.pause_instance_id || !isMainPauseLibraryBookmark(currentSelectedItem.source_type))
      return undefined;
    return linkedMap.get(currentSelectedItem.pause_instance_id);
  }, [currentSelectedItem, linkedMap]);

  const handleSelectFromViewer = useCallback((item: LibraryItem) => {
    setSelectedItem(item);
  }, []);

  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedFiltered = filtered.filter((i) => !i.pinned);
  const unpinnedGroups = useMemo(
    () =>
      dateGroupStyle === 'calendarDay'
        ? groupByCalendarDay(unpinnedFiltered, t)
        : groupByDate(unpinnedFiltered, t),
    [unpinnedFiltered, t, dateGroupStyle],
  );

  // Build flat list with group info for virtuoso
  const { flatItems, groupCounts, groupLabels } = useMemo(() => {
    const flat: LibraryItem[] = [];
    const counts: number[] = [];
    const labels: string[] = [];

    if (pinnedItems.length > 0) {
      labels.push(`📌 ${t('common.pinned')}`);
      counts.push(pinnedItems.length);
      flat.push(...pinnedItems);
    }

    unpinnedGroups.forEach((group) => {
      labels.push(group.label);
      counts.push(group.items.length);
      flat.push(...group.items);
    });

    return { flatItems: flat, groupCounts: counts, groupLabels: labels };
  }, [pinnedItems, unpinnedGroups, t]);

  const renderCard = useCallback(
    (index: number, item: LibraryItem) => {
      const pauseMeta: PauseInstanceArchiveMeta | undefined = item.pause_instance_id
        ? getPauseArchiveMeta(item.pause_instance_id)
        : undefined;
      const showPauseSummary =
        !echoesPresentation && isMainPauseLibraryBookmark(item.source_type) && !!item.pause_instance_id;
      return (
        <div className="flex items-center border-b border-border/20">
          {selectMode && (
            <button
              onClick={() => toggleSelect(item.id)}
              className={cn(
                'shrink-0 w-5 h-5 rounded border flex items-center justify-center ml-2 mr-0.5 transition-colors',
                selectedIds.has(item.id)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border/60 text-transparent hover:border-muted-foreground/40',
              )}
            >
              {selectedIds.has(item.id) && (
                <svg viewBox="0 0 12 12" className="h-3 w-3">
                  <path
                    d="M10 3L4.5 8.5 2 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <SwipeableCard
              disabled={selectMode}
              onSwipeRight={() => toggleFavorite(item.id)}
              onSwipeLeft={() => deleteItem(item.id)}
              leftLabel={t('common.delete')}
              rightLabel={
                item.is_favorite
                  ? t('libraryCard.removeFavorite', { defaultValue: 'Unfavorite' })
                  : t('libraryCard.addFavorite', { defaultValue: 'Favorite' })
              }
            >
              <LibraryItemCard
                item={item}
                echoesPresentation={echoesPresentation}
                onToggleFavorite={selectMode ? () => toggleSelect(item.id) : toggleFavorite}
                engaged={isCompanionEngaged(item)}
                incomplete={isReflectionIncomplete(item)}
                pauseArchiveMeta={showPauseSummary ? pauseMeta : undefined}
                reflectionOutcome={showPauseSummary ? getReflectionOutcome(item) : null}
                showPauseSessionSummary={showPauseSummary}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(item.id);
                  } else {
                    setSelectedItem(item);
                  }
                }}
              />
            </SwipeableCard>
          </div>
        </div>
      );
    },
    [
      selectMode,
      selectedIds,
      toggleSelect,
      toggleFavorite,
      deleteItem,
      isCompanionEngaged,
      isReflectionIncomplete,
      echoesPresentation,
      getPauseArchiveMeta,
      getReflectionOutcome,
      t,
    ],
  );

  // Use virtual scrolling only when the list is large enough to benefit
  const useVirtual = flatItems.length > 30;

  return (
    <>
      <div className="flex flex-col">
        {/* Select mode toggle + bulk action bar */}
        <div className="flex items-center justify-between px-1 min-h-[28px] shrink-0">
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
              <ExportMenu
                items={filtered.filter((i) => selectedIds.has(i.id))}
                label={`${selectedIds.size}`}
              />
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
                className="flex items-center gap-1 transition-colors ml-auto text-sm font-sans text-secondary-foreground"
              >
                <CheckSquare className="h-3 w-3" />
                {t('library.select', { defaultValue: 'Select' })}
              </button>
            )
          )}
        </div>

        <div>
          {loading && filtered.length === 0 && !listLoadFailed ? (
            <div className="flex justify-center py-16" role="status" aria-busy="true" aria-label={t('common.loading')}>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
            </div>
          ) : listLoadFailed && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {t('library.listLoadFailed', {
                  defaultValue: 'Could not load your library list. Check your connection and try again.',
                })}
              </p>
              <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
                {t('common.retry', { defaultValue: 'Retry' })}
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 space-y-3 px-2">
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {emptyStateMessage ??
                  t('library.emptyStateAction', {
                    defaultValue: 'Complete a pause session to see saved companions, notes, and insights here.',
                  })}
              </p>
              {(() => {
                const hint =
                  emptyStateHint === undefined
                    ? t('library.emptyStateHint', { defaultValue: 'Swipe cards left to delete, right to favorite' })
                    : emptyStateHint;
                return hint ? (
                  <p className="text-xs text-muted-foreground/50">{hint}</p>
                ) : null;
              })()}
              {emptyCtaLabel && emptyCtaTo ? (
                <Link
                  to={emptyCtaTo}
                  className="inline-block text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  {emptyCtaLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              {pinnedItems.length > 0 && (
                <div className="space-y-0.5">
                  <p className="uppercase tracking-wider px-3 pb-1 text-sm font-sans font-normal text-[#dbb266]">
                    📌 {t('common.pinned')}
                  </p>
                  <div className="space-y-4">
                    {pinnedItems.map((item, i) => (
                      i < 10 ? (
                        <motion.div
                          key={item.id}
                          initial={false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {renderCard(i, item)}
                        </motion.div>
                      ) : (
                        <div key={item.id}>{renderCard(i, item)}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {unpinnedGroups.map((group) => (
                <div key={group.key} className="space-y-0.5">
                  <p className="uppercase tracking-wider px-3 pb-1 text-sm font-sans font-normal text-[#dbb266] mt-0 pt-[16px]">
                    {group.label}
                  </p>
                  <div className="space-y-4">
                    {group.items.map((item, i) => (
                      i < 10 ? (
                        <motion.div
                          key={item.id}
                          initial={false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {renderCard(i, item)}
                        </motion.div>
                      ) : (
                        <div key={item.id}>{renderCard(i, item)}</div>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
        isIncomplete={currentSelectedItem ? isReflectionIncomplete(currentSelectedItem) : false}
        currentOutcome={currentSelectedItem ? getReflectionOutcome(currentSelectedItem) : null}
        onOutcomeRecorded={refetch}
      />
    </>
  );
}
