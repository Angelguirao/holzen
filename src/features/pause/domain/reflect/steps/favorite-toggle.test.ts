import { describe, expect, it } from 'vitest';
import {
  buildReflectFavoriteToggledPayload,
  computeFavoriteToggleNext,
  shouldShowFavoriteProHint,
} from './favorite-toggle';

describe('buildReflectFavoriteToggledPayload', () => {
  it('builds favorite_toggled payload', () => {
    expect(buildReflectFavoriteToggledPayload(true)).toEqual({ is_favorite: true });
  });
});

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
