import { describe, expect, it } from 'vitest';
import type { Collection, CollectionItem } from '@/legacy/archive-collections/domain/library-bundle';
import {
  collectionsContainingPauseInstance,
  countCollectionItems,
  hasCollectionMembership,
  nextCollectionItemPosition,
  sortedPauseInstanceIdsInCollection,
} from './library-bundle-collection-helpers';

const collection: Collection = {
  id: 'col-1',
  user_id: 'user-1',
  name: 'Favorites',
  description: null,
  icon: null,
  color: null,
  created_at: '2026-05-01T00:00:00Z',
};

const items: CollectionItem[] = [
  {
    id: 'ci-1',
    collection_id: 'col-1',
    pause_instance_id: 'pause-b',
    position: 1,
    added_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'ci-2',
    collection_id: 'col-1',
    pause_instance_id: 'pause-a',
    position: 0,
    added_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 'ci-3',
    collection_id: 'col-2',
    pause_instance_id: 'pause-a',
    position: 0,
    added_at: '2026-05-01T00:00:00Z',
  },
];

describe('library-bundle-collection-helpers', () => {
  it('detects membership and next position', () => {
    expect(hasCollectionMembership(items, 'col-1', 'pause-a')).toBe(true);
    expect(hasCollectionMembership(items, 'col-1', 'pause-missing')).toBe(false);
    expect(nextCollectionItemPosition(items, 'col-1')).toBe(2);
    expect(nextCollectionItemPosition([], 'col-new')).toBe(0);
  });

  it('sorts pause ids and counts items per collection', () => {
    expect(sortedPauseInstanceIdsInCollection(items, 'col-1')).toEqual(['pause-a', 'pause-b']);
    expect(countCollectionItems(items, 'col-1')).toBe(2);
    expect(countCollectionItems(items, 'col-missing')).toBe(0);
  });

  it('returns collections that contain a pause instance', () => {
    expect(collectionsContainingPauseInstance([collection], items, 'pause-a')).toEqual([collection]);
    expect(collectionsContainingPauseInstance([collection], items, 'pause-missing')).toEqual([]);
  });
});
