import { describe, it, expect } from 'vitest';
import {
  normalizeLibrarySourceType,
  isMainPauseLibraryBookmark,
  isPauseLibraryNote,
} from './normalize-library-source-type';

describe('normalizeLibrarySourceType', () => {
  it('maps legacy reflection discriminators', () => {
    expect(normalizeLibrarySourceType('reflection')).toBe('pause');
    expect(normalizeLibrarySourceType('reflection_note')).toBe('pause_note');
  });

  it('passes through canonical and other types', () => {
    expect(normalizeLibrarySourceType('pause')).toBe('pause');
    expect(normalizeLibrarySourceType('zoom_out')).toBe('zoom_out');
    expect(normalizeLibrarySourceType(undefined)).toBeUndefined();
    expect(normalizeLibrarySourceType(null)).toBeUndefined();
  });

  it('helpers classify bookmarks and notes', () => {
    expect(isMainPauseLibraryBookmark('reflection')).toBe(true);
    expect(isMainPauseLibraryBookmark('pause')).toBe(true);
    expect(isMainPauseLibraryBookmark('zoom_out')).toBe(false);
    expect(isPauseLibraryNote('reflection_note')).toBe(true);
    expect(isPauseLibraryNote('pause_note')).toBe(true);
  });
});
