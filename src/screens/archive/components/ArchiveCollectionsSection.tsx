import { usePauseLibraryBundle } from '@/features/pause/public-hooks';
import { LibraryCollections } from '@/screens/archive/components/library/LibraryCollections';

type Props = {
  listSort: 'newest' | 'oldest' | 'alphabetical';
};

/**
 * Collections tab: `usePauseLibraryBundle` loads `collection_items` + `v_pause_full` rows for members.
 * Pause lists use `usePauseArchiveList` (`v_pause_archive_*`).
 */
export function ArchiveCollectionsSection({ listSort }: Props) {
  const library = usePauseLibraryBundle({ listSort });

  return (
    <div className="space-y-4">
      <LibraryCollections library={library} />
    </div>
  );
}
