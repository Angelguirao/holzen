import { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LibraryItemCard } from './LibraryItemCard';
import { NewNoteForm } from './NewNoteForm';
import { NewCollectionForm } from './NewCollectionForm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { useLibrary } from '@/hooks/use-library';
import type { Collection } from '@/hooks/use-library';

interface Props {
  library: ReturnType<typeof useLibrary>;
  favoritesOnly?: boolean;
}

const TYPE_FILTERS = [
  { key: 'all', labelKey: 'library.tabAll' },
  { key: 'bookmarks', labelKey: 'library.tabBookmarks' },
  { key: 'notes', labelKey: 'library.tabNotes' },
] as const;

function CollectionChip({
  col,
  count,
  isActive,
  onSelect,
  onRename,
  onDelete,
  t,
}: {
  col: Collection;
  count: number;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  t: (k: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(col.name);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startLongPress = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setMenuOpen(true);
    }, 500);
  }, []);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleClick = () => {
    if (didLongPress.current) return;
    onSelect();
  };

  const handleRenameSubmit = () => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== col.name) onRename(trimmed);
    setRenaming(false);
    setMenuOpen(false);
  };

  if (renaming) {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          ref={inputRef}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRenameSubmit();
            if (e.key === 'Escape') { setRenaming(false); setMenuOpen(false); }
          }}
          onBlur={handleRenameSubmit}
          autoFocus
          maxLength={80}
          className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-foreground/20 bg-foreground/5 text-foreground w-24 focus:outline-none focus:ring-1 focus:ring-ring/30"
        />
      </div>
    );
  }

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={handleClick}
          onContextMenu={(e) => { e.preventDefault(); setMenuOpen(true); }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          className={cn(
            'text-[9px] font-mono px-2 py-0.5 rounded-full border transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1',
            isActive
              ? 'border-foreground/20 bg-foreground/5 text-foreground'
              : 'border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60'
          )}
        >
          {col.icon && <span className="text-[9px]">{col.icon}</span>}
          {col.name}
          <span className="text-muted-foreground/30">{count}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-36 p-1" sideOffset={6}>
        <button
          onClick={() => { setNewName(col.name); setRenaming(true); }}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-mono text-foreground/70 hover:bg-muted rounded transition-colors"
        >
          <Pencil className="h-3 w-3" />
          {t('library.renameCollection')}
        </button>
        <button
          onClick={() => {
            if (window.confirm(t('library.deleteCollectionConfirm'))) {
              onDelete();
              setMenuOpen(false);
            }
          }}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-[10px] font-mono text-destructive/70 hover:bg-destructive/10 rounded transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          {t('library.deleteCollection')}
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function LibraryItems({ library, favoritesOnly = false }: Props) {
  const { t } = useTranslation();
  const {
    items, collections, collectionItems, loading,
    addItem, updateItem, deleteItem, togglePin,
    addToCollection, removeFromCollection, getItemCollections,
    addCollection, updateCollection, deleteCollection,
  } = library;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);

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

  const handleRenameCollection = async (id: string, name: string) => {
    await updateCollection(id, { name });
    toast.success(t('library.collectionRenamed'));
  };

  const handleDeleteCollection = async (id: string) => {
    if (collectionFilter === id) setCollectionFilter(null);
    await deleteCollection(id);
    toast.success(t('library.collectionDeleted'));
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
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <FolderOpen className="h-3 w-3 text-muted-foreground/30 flex-shrink-0" />
          {collections.length > 0 && (
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
          )}
          {collections.map((col) => {
            const count = collectionItems.filter((ci) => ci.collection_id === col.id).length;
            return (
              <CollectionChip
                key={col.id}
                col={col}
                count={count}
                isActive={collectionFilter === col.id}
                onSelect={() => setCollectionFilter(collectionFilter === col.id ? null : col.id)}
                onRename={(name) => handleRenameCollection(col.id, name)}
                onDelete={() => handleDeleteCollection(col.id)}
                t={t}
              />
            );
          })}
          <button
            onClick={() => setShowNewCollection(true)}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border border-dashed border-border/30 text-muted-foreground/40 hover:text-muted-foreground/60 hover:border-border/50 transition-colors flex-shrink-0 flex items-center gap-0.5"
          >
            <Plus className="h-2.5 w-2.5" />
            {t('library.newCollection')}
          </button>
        </div>

        {showNewCollection && (
          <NewCollectionForm
            onSave={async (name, description, icon) => {
              await addCollection({ name, description, icon });
              setShowNewCollection(false);
            }}
          />
        )}
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
          {search ? t('library.noResults') : activeCollection ? t('library.emptyCollection') : t('library.emptyState')}
        </p>
      )}
    </div>
  );
}
