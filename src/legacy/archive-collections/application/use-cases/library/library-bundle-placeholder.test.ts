import { describe, expect, it } from 'vitest';
import {
  buildLibraryBundlePlaceholder,
  isLibraryBundleInitialLoading,
} from './library-bundle-placeholder';
import type { CollectionMemberPause } from '@/legacy/archive-collections/domain/library-bundle';

const memberRow = {
  id: 'pause-1',
  user_id: 'user-1',
  terminal_at: '2026-05-01T12:00:00Z',
  created_at: '2026-05-01T11:00:00Z',
  source: 'B',
} as CollectionMemberPause;

describe('library-bundle-placeholder', () => {
  it('returns undefined when cache snapshot is empty', () => {
    expect(
      buildLibraryBundlePlaceholder({
        listSort: 'newest',
        items: [],
        collections: [],
        collectionItems: [],
      }),
    ).toBeUndefined();
  });

  it('sorts cached member rows for placeholder data', () => {
    const older = { ...memberRow, id: 'a', terminal_at: '2026-05-01T10:00:00Z', source: 'A' };
    const newer = { ...memberRow, id: 'b', terminal_at: '2026-05-02T10:00:00Z', source: 'B' };
    const bundle = buildLibraryBundlePlaceholder({
      listSort: 'newest',
      items: [older, newer],
      collections: [],
      collectionItems: [],
    });
    expect(bundle?.items.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('shows initial loading only when fetching with empty lists', () => {
    expect(
      isLibraryBundleInitialLoading({
        hasUser: true,
        isFetching: true,
        collectionCount: 0,
        collectionItemCount: 0,
        itemCount: 0,
      }),
    ).toBe(true);
    expect(
      isLibraryBundleInitialLoading({
        hasUser: true,
        isFetching: true,
        collectionCount: 0,
        collectionItemCount: 0,
        itemCount: 1,
      }),
    ).toBe(false);
  });
});
