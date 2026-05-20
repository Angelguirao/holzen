import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Collection, CollectionMemberPause } from '@/legacy/archive-collections/domain/library-bundle';
import { ArchivePauseCard } from '@/screens/archive/components/ArchivePauseCard';

interface Props {
  collection: Collection;
  items: CollectionMemberPause[];
  itemIds: string[];
  onBack: () => void;
  onDeleteCollection: (id: string) => void;
  onRemoveItem: (collectionId: string, pauseInstanceId: string) => Promise<void>;
  /** After logging a retrospective outcome on a member pause card, refresh library rows. */
  onPauseOutcomeLogged?: () => void | Promise<void>;
}

export function CollectionDetail({
  collection,
  items,
  itemIds,
  onBack,
  onDeleteCollection,
  onRemoveItem,
  onPauseOutcomeLogged,
}: Props) {
  const { t } = useTranslation();

  const collectionRows = useMemo(() => {
    return itemIds.map((id) => items.find((r) => r.id === id)).filter(Boolean) as CollectionMemberPause[];
  }, [itemIds, items]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-lg">{collection.icon ?? '📂'}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-mono font-medium text-foreground truncate">{collection.name}</h2>
          {collection.description ? (
            <p className="text-[10px] text-muted-foreground/60 truncate">{collection.description}</p>
          ) : null}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {t('library.itemCount', { count: collectionRows.length })}
        </span>
        <button
          type="button"
          onClick={() => {
            onDeleteCollection(collection.id);
            onBack();
          }}
          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="Delete collection"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {collectionRows.length > 0 ? (
        <div className="space-y-3">
          {collectionRows.map((row) => (
            <div key={row.id ?? ''} className="relative">
              <ArchivePauseCard row={row} echoesPresentation={false} onOutcomeLogged={onPauseOutcomeLogged} />
              <button
                type="button"
                onClick={() => void onRemoveItem(collection.id, row.id!)}
                className="absolute right-3 top-3 text-[9px] font-mono text-muted-foreground/30 hover:text-destructive transition-colors px-1"
              >
                remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">{t('library.emptyCollection')}</p>
      )}
    </div>
  );
}
