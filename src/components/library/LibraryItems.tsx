import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LibraryItemCard } from './LibraryItemCard';
import { NewNoteForm } from './NewNoteForm';
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
    items, collections, loading,
    addItem, updateItem, deleteItem, togglePin,
    addToCollection, removeFromCollection, getItemCollections,
  } = library;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = items;
    if (!search.trim()) result = result.filter((i) => i.status !== 'archived');
    if (typeFilter === 'bookmarks') result = result.filter((i) => i.type === 'bookmark');
    if (typeFilter === 'notes') result = result.filter((i) => i.type === 'note');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title?.toLowerCase().includes(q) ||
        i.body?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
      );
    }
    return result;
  }, [items, typeFilter, search]);

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

      <div className="flex items-center gap-2">
        {TYPE_FILTERS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
              typeFilter === key
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {t('library.itemCount', { count: filtered.length })}
        </span>
      </div>

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
          {search ? t('library.noResults') : t('library.emptyState')}
        </p>
      )}
    </div>
  );
}
