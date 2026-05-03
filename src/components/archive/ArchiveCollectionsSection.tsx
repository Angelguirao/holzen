import { useLibrary } from '@/hooks/use-library';
import { LibraryCollections } from '@/components/library/LibraryCollections';

type Props = {
  listSort: 'newest' | 'oldest' | 'alphabetical';
};

/**
 * Collections tab: `useLibrary` loads `collection_items` + `v_pause_full` rows for members.
 * Pause lists use `usePauseArchiveList` (`v_pause_archive_*`).
 */
export function ArchiveCollectionsSection({ listSort }: Props) {
  const library = useLibrary({ listSort });

  return (
    <div className="space-y-4">
      <LibraryCollections library={library} />
    </div>
  );
}
