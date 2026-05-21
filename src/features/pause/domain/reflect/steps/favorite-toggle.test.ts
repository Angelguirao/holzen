import { describe, expect, it } from 'vitest';
import { computeFavoriteToggleNext, shouldShowFavoriteProHint } from './favorite-toggle';

describe('computeFavoriteToggleNext', () => {
  it('flips boolean', () => {
    expect(computeFavoriteToggleNext(false)).toBe(true);
    expect(computeFavoriteToggleNext(true)).toBe(false);
  });
});

describe('shouldShowFavoriteProHint', () => {
  it('shows only when favoriting while not subscribed', () => {
    expect(shouldShowFavoriteProHint(true, false)).toBe(true);
    expect(shouldShowFavoriteProHint(true, true)).toBe(false);
    expect(shouldShowFavoriteProHint(false, false)).toBe(false);
  });
});
