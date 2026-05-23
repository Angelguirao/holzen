import { describe, expect, it } from 'vitest';

import { runToggleCompanionLibraryFavorite as toggleFavoriteDirect } from './run-toggle-companion-library-favorite';

import { runToggleCompanionLibraryFavorite } from './pause-companion-library-favorite-flow';

describe('pause-companion-library-favorite-flow', () => {
  it('re-exports library favorite toggle from run-toggle-companion-library-favorite', () => {
    expect(typeof runToggleCompanionLibraryFavorite).toBe('function');
    expect(runToggleCompanionLibraryFavorite).toBe(toggleFavoriteDirect);
  });
});
