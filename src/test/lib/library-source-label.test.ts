import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { librarySourceLabel } from '@/lib/library-source-label';

describe('librarySourceLabel', () => {
  it('uses default when source type is missing', () => {
    const t = vi.fn() as unknown as TFunction;
    expect(librarySourceLabel(undefined, t, 'X')).toBe('X');
    expect(t).not.toHaveBeenCalled();
  });

  it('resolves an i18n key when present', () => {
    const t = vi.fn().mockReturnValue('Pause') as unknown as TFunction;
    expect(librarySourceLabel('pause', t, 'fallback')).toBe('Pause');
    expect(t).toHaveBeenCalledWith('librarySources.pause', { defaultValue: 'fallback' });
  });
});
