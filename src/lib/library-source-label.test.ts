import { describe, it, expect, vi } from 'vitest';
import { librarySourceLabel } from './library-source-label';

describe('librarySourceLabel', () => {
  it('uses default when source type is missing', () => {
    const t = vi.fn();
    expect(librarySourceLabel(undefined, t, 'X')).toBe('X');
    expect(t).not.toHaveBeenCalled();
  });

  it('resolves an i18n key when present', () => {
    const t = vi.fn().mockReturnValue('Pause');
    expect(librarySourceLabel('reflection', t, 'fallback')).toBe('Pause');
    expect(t).toHaveBeenCalledWith('librarySources.reflection', { defaultValue: 'fallback' });
  });
});
