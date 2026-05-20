import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionCard } from './CollectionCard';
import { NewCollectionForm } from './NewCollectionForm';
import { CollectionDetail } from './CollectionDetail';
import type { usePauseLibraryBundle } from '@/features/pause/public-hooks';

interface Props {
  library: ReturnType<typeof usePauseLibraryBundle>;
}

export function LibraryCollections({ library }: Props) {
  const { t } = useTranslation();
  const { collections, addCollection, deleteCollection, getCollectionItemIds, getCollectionItemCount, removeFromCollection, items } =
    library;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCollection = collections.find((c) => c.id === selectedId);

  const handleCreate = useCallback(
    async (name: string, description: string, icon: string) => {
      await addCollection({ name, description: description || null, icon });
    },
    [addCollection],
  );

  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        items={items}
        itemIds={getCollectionItemIds(selectedCollection.id)}
        onBack={() => setSelectedId(null)}
        onDeleteCollection={deleteCollection}
        onRemoveItem={removeFromCollection}
        onPauseOutcomeLogged={() => void library.refetch()}
      />
    );
  }

  return (
    <div className="space-y-3">
      <NewCollectionForm onSave={handleCreate} />
      {collections.map((col) => (
        <CollectionCard key={col.id} collection={col} itemCount={getCollectionItemCount(col.id)} onDelete={deleteCollection} onSelect={setSelectedId} />
      ))}
      {collections.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">{t('library.noCollections')}</p>
      )}
    </div>
  );
}
