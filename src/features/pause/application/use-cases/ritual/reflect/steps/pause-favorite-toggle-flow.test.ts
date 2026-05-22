import { describe, expect, it } from 'vitest';

import { shouldShowFavoriteProHint } from '@/features/pause/domain/reflect/steps/favorite-toggle';

import { runPauseFavoriteToggle as runFavoriteDirect } from './run-pause-favorite-toggle';
import { runPauseFavoriteToggle, shouldShowFavoriteProHint as shouldShowFromFlow } from './pause-favorite-toggle-flow';

describe('pause-favorite-toggle-flow', () => {
  it('re-exports favorite toggle use case and domain pro-hint gate', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof shouldShowFromFlow).toBe('function');

    expect(runPauseFavoriteToggle).toBe(runFavoriteDirect);
    expect(shouldShowFromFlow).toBe(shouldShowFavoriteProHint);
  });
});
