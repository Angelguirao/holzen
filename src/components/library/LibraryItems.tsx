import { useTranslation } from 'react-i18next';
import { LibraryItemCard } from './LibraryItemCard';
import { toast } from 'sonner';
import type { useLibrary } from '@/hooks/use-library';
import type { LibraryItem } from '@/hooks/use-library';

interface Props {
  library: ReturnType<typeof useLibrary>;
  filtered: LibraryItem[];
}

export function LibraryItems({ library, filtered }: Props) {
  const { t } = useTranslation();
  const {
    collections, updateItem, deleteItem, togglePin,
    addToCollection, removeFromCollection, getItemCollections,
  } = library;

  const handleStatusChange = async (id: string, status: 'unread' | 'read' | 'archived') => {
    await updateItem(id, { status } as any);
  };

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await updateItem(id, { tags } as any);
  };

  const pinnedItems = filtered.filter((i) => i.pinned);
  const unpinnedItems = filtered.filter((i) => !i.pinned);

  const renderCard = (item: LibraryItem) => (
    <LibraryItemCard
      key={item.id}
      item={item}
      onTogglePin={togglePin}
      onDelete={deleteItem}
      onStatusChange={handleStatusChange}
      onUpdateTags={handleUpdateTags}
      collections={collections}
      itemCollections={getItemCollections(item.id)}
      onAddToCollection={addToCollection}
      onRemoveFromCollection={removeFromCollection}
    />
  );

  return (
    <div className="space-y-1.5">
      {pinnedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">{t('common.pinned')}</p>
          {pinnedItems.map(renderCard)}
        </div>
      )}

      {unpinnedItems.map(renderCard)}

      {filtered.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
          {t('library.emptyState')}
        </p>
      )}
    </div>
  );
}
