import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FolderOpen, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LibraryItemCard } from './LibraryItemCard';
import { NewNoteForm } from './NewNoteForm';
import { cn } from '@/lib/utils';
import type { useLibrary } from '@/hooks/use-library';

interface Props {
  library: ReturnType<typeof useLibrary>;
}

const TYPE_FILTERS = [
  { key: 'all', labelKey: 'library.tabAll' },
  { key: 'bookmarks', labelKey: 'library.tabBookmarks' },
  { key: 'notes', labelKey: 'library.tabNotes' },
] as const;

export function LibraryItems({ library }: Props) {
  const { t } = useTranslation();
  const {
    items, collections, collectionItems, loading,
    addItem, updateItem, deleteItem, togglePin,
    addToCollection, removeFromCollection, getItemCollections,
    addCollection,
  } = library;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = items;
    if (!search.trim()) result = result.filter((i) => i.status !== 'archived');
    if (typeFilter === 'bookmarks') result = result.filter((i) => i.type === 'bookmark');
    if (typeFilter === 'notes') result = result.filter((i) => i.type === 'note');
    if (collectionFilter) {
      const itemIds = new Set(
        collectionItems
          .filter((ci) => ci.collection_id === collectionFilter)
          .map((ci) => ci.library_item_id)
      );
      result = result.filter((i) => itemIds.has(i.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.body?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
      );
    }
    return result;
  }, [items, typeFilter, collectionFilter, collectionItems, search]);

  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedItems = filtered.filter((i) => !i.pinned);

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status } as any);
  };

  const handleNewNote = async (title: string, body: string, tags: string[]) => {
    await addItem({ type: 'note', title: title || null, body, tags });
  };

  const renderCard = (item: typeof items[0]) => (
    <LibraryItemCard
      key={item.id}
      item={item}
      onTogglePin={togglePin}
      onDelete={deleteItem}
      onStatusChange={handleStatusChange}
      collections={collections}
      itemCollections={getItemCollections(item.id)}
      onAddToCollection={addToCollection}
      onRemoveFromCollection={removeFromCollection}
    />
  );

  const activeCollection = collectionFilter
    ? collections.find((c) => c.id === collectionFilter)
    : null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          className="pl-8 h-8 text-xs font-mono"
        />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2">
        {TYPE_FILTERS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={cn(
              'text-[10px] font-mono px-2 py-1 rounded transition-colors',
              typeFilter === key
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground/50 hover:text-muted-foreground'
            )}
          >
            {t(labelKey)}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {t('library.itemCount', { count: filtered.length })}
        </span>
      </div>

      {/* Collection filter chips */}
      {collections.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <FolderOpen className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
          <button
            onClick={() => setCollectionFilter(null)}
            className={cn(
              'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap flex-shrink-0',
              !collectionFilter
                ? 'border-foreground/20 bg-foreground/5 text-foreground'
                : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
            )}
          >
            {t('library.allCollections')}
          </button>
          {collections.map((col) => {
            const count = collectionItems.filter((ci) => ci.collection_id === col.id).length;
            return (
              <button
                key={col.id}
                onClick={() => setCollectionFilter(collectionFilter === col.id ? null : col.id)}
                className={cn(
                  'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1',
                  collectionFilter === col.id
                    ? 'border-foreground/20 bg-foreground/5 text-foreground'
                    : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
                )}
              >
                {col.icon && <span className="text-[9px]">{col.icon}</span>}
                {col.name}
                <span className="text-muted-foreground/30">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <NewNoteForm onSave={handleNewNote} />

      {pinnedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('common.pinned')}</p>
          {pinnedItems.map(renderCard)}
        </div>
      )}

      <div className="space-y-1.5">
        {unpinnedItems.map(renderCard)}
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
          {search ? t('library.noResults') : activeCollection ? t('library.emptyCollection') : t('library.emptyState')}
        </p>
      )}
    </div>
  );
}
