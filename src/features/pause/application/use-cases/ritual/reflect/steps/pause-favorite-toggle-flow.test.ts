import { describe, expect, it } from 'vitest';

import { runPauseFavoriteToggle, shouldShowFavoriteProHint } from './pause-favorite-toggle-flow';

describe('pause-favorite-toggle-flow', () => {
  it('re-exports favorite toggle use case and domain pro-hint gate', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
  });
});
