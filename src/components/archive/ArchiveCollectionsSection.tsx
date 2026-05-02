import { useLibrary } from '@/hooks/use-library';
import { LibraryCollections } from '@/components/library/LibraryCollections';

type Props = {
  listSort: 'newest' | 'oldest' | 'alphabetical';
};

/**
 * Collections use `library_items` + `collection_items`. Isolated in a child so the
 * Archive shell can use pause-instance lists for Pauses/Echoes without mixing hooks.
 */
export function ArchiveCollectionsSection({ listSort }: Props) {
  const library = useLibrary({ listSort });

  return (
    <div className="space-y-4">
      <LibraryCollections library={library} />
    </div>
  );
}
