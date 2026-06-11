import { describe, expect, it } from 'vitest';
import {
  collectArchiveTags,
  filterAndSortArchiveRows,
  rowMatchesArchiveSearch,
} from '@/legacy/archive-search-sort/lib/archive-list-filter';
import type { PauseArchiveRow } from '@/features/pause/public-hooks';

const row = (overrides: Partial<PauseArchiveRow>): PauseArchiveRow =>
  ({
    id: '1',
    created_at: '2026-01-01T00:00:00Z',
    terminal_at: null,
    tags: [],
    source: 'btc',
    ...overrides,
  }) as PauseArchiveRow;

describe('archive-list-filter', () => {
  it('matches search across text fields', () => {
    expect(rowMatchesArchiveSearch(row({ reflection_text: 'steady breath' }), 'breath')).toBe(true);
    expect(rowMatchesArchiveSearch(row({ reflection_text: 'steady' }), 'breath')).toBe(false);
  });

  it('collects tags by frequency', () => {
    const tags = collectArchiveTags([
      row({ tags: ['calm', 'focus'] }),
      row({ id: '2', tags: ['calm'] }),
    ]);
    expect(tags).toEqual(['calm', 'focus']);
  });

  it('filters by tag and sorts newest first', () => {
    const rows = [
      row({ id: 'a', terminal_at: '2026-01-02T00:00:00Z', tags: ['calm'] }),
      row({ id: 'b', terminal_at: '2026-01-03T00:00:00Z', tags: ['other'] }),
      row({ id: 'c', terminal_at: '2026-01-01T00:00:00Z', tags: ['calm'] }),
    ];
    const out = filterAndSortArchiveRows(rows, {
      tagFilter: 'calm',
      search: '',
      sortMode: 'newest',
    });
    expect(out.map((r) => r.id)).toEqual(['a', 'c']);
  });
});
