import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { LibraryItemCard } from './LibraryItemCard';
import type { Collection, LibraryItem } from '@/hooks/use-library';

interface Props {
  collection: Collection;
  items: LibraryItem[];
  itemIds: string[];
  onBack: () => void;
  onDeleteCollection: (id: string) => void;
  onRemoveItem: (collectionId: string, itemId: string) => Promise<void>;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onStatusChange: (id: string, status: 'unread' | 'read' | 'archived') => void;
}

export function CollectionDetail({
  collection, items, itemIds, onBack, onDeleteCollection, onRemoveItem,
  onTogglePin, onToggleFavorite, onDeleteItem, onStatusChange,
}: Props) {
  const { t } = useTranslation();

  const collectionItems = useMemo(() => {
    return itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as LibraryItem[];
  }, [itemIds, items]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg">{collection.icon ?? '📂'}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-mono font-medium text-foreground truncate">{collection.name}</h2>
          {collection.description && (
            <p className="text-[10px] text-muted-foreground/60 truncate">{collection.description}</p>
          )}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {t('library.itemCount', { count: collectionItems.length })}
        </span>
        <button
          onClick={() => { onDeleteCollection(collection.id); onBack(); }}
          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="Delete collection"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Items */}
      {collectionItems.length > 0 ? (
        <div className="space-y-1.5">
          {collectionItems.map((item) => (
            <div key={item.id} className="relative">
              <LibraryItemCard
                item={item}
                onTogglePin={onTogglePin}
                onToggleFavorite={onTogglePin}
                onDelete={onDeleteItem}
                onStatusChange={onStatusChange}
              />
              <button
                onClick={() => onRemoveItem(collection.id, item.id)}
                className="absolute top-1 right-1 text-[9px] font-mono text-muted-foreground/30 hover:text-destructive transition-colors px-1"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
          {t('library.emptyCollection')}
        </p>
      )}
    </div>
  );
}
