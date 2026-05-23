import { describe, it, expect } from 'vitest';
import {
  normalizeLibrarySourceType,
  isMainPauseLibraryBookmark,
  isPauseLibraryNote,
} from '@/features/pause/domain/normalize-library-source-type';

describe('normalizeLibrarySourceType', () => {
  it('passes through canonical types', () => {
    expect(normalizeLibrarySourceType('pause')).toBe('pause');
    expect(normalizeLibrarySourceType('zoom_out')).toBe('zoom_out');
    expect(normalizeLibrarySourceType(undefined)).toBeUndefined();
    expect(normalizeLibrarySourceType(null)).toBeUndefined();
  });

  it('helpers classify bookmarks and notes', () => {
    expect(isMainPauseLibraryBookmark('pause')).toBe(true);
    expect(isMainPauseLibraryBookmark('reflection')).toBe(false);
    expect(isMainPauseLibraryBookmark('zoom_out')).toBe(false);
    expect(isPauseLibraryNote('pause_note')).toBe(true);
    expect(isPauseLibraryNote('reflection_note')).toBe(false);
  });
});
