import { describe, expect, it } from 'vitest';
import {
  buildPauseArchiveInfiniteInitialData,
  isPauseArchiveListInitialLoading,
} from './pause-archive-list-ui-state';

describe('pause-archive-list-ui-state', () => {
  it('returns undefined when cache is empty', () => {
    expect(buildPauseArchiveInfiniteInitialData(null, 50)).toBeUndefined();
    expect(buildPauseArchiveInfiniteInitialData([], 50)).toBeUndefined();
  });

  it('seeds first infinite page from cache', () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: `p-${i}` }));
    expect(buildPauseArchiveInfiniteInitialData(rows, 50)).toEqual({
      pages: [rows],
      pageParams: [0],
    });
  });

  it('truncates cache to page size for initial data', () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ id: `p-${i}` }));
    const initial = buildPauseArchiveInfiniteInitialData(rows, 50);
    expect(initial?.pages[0]).toHaveLength(50);
  });

  it('shows initial loading only when fetching with no rows', () => {
    expect(
      isPauseArchiveListInitialLoading({
        queryEnabled: true,
        isError: false,
        rowCount: 0,
        isPending: true,
        isFetching: false,
      }),
    ).toBe(true);
    expect(
      isPauseArchiveListInitialLoading({
        queryEnabled: true,
        isError: false,
        rowCount: 2,
        isPending: true,
        isFetching: true,
      }),
    ).toBe(false);
  });
});
