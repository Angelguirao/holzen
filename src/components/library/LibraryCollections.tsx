import { useTranslation } from 'react-i18next';
import { CollectionCard } from './CollectionCard';
import type { useLibrary } from '@/hooks/use-library';

interface Props {
  library: ReturnType<typeof useLibrary>;
}

export function LibraryCollections({ library }: Props) {
  const { t } = useTranslation();
  const { collections, deleteCollection } = library;

  return (
    <div className="space-y-2">
      {collections.map((col) => (
        <CollectionCard
          key={col.id}
          collection={col}
          itemCount={0}
          onDelete={deleteCollection}
          onSelect={() => {}}
        />
      ))}
      {collections.length === 0 && (
        <p className="text-xs text-muted-foreground/40 text-center py-8 font-mono">
          {t('library.noCollections')}
        </p>
      )}
    </div>
  );
}
