import { describe, expect, it } from 'vitest';
import {
  flipCompanionSlotFavoriteInBucket,
  mergeCompanionSlotFavoriteBuckets,
} from './companion-slot-favorites-metadata';

describe('companion slot favorites metadata', () => {
  it('flipCompanionSlotFavoriteInBucket keeps other favorited slots', () => {
    expect(flipCompanionSlotFavoriteInBucket({ signal: true }, 'grounding')).toEqual({
      signal: true,
      grounding: true,
    });
  });

  it('mergeCompanionSlotFavoriteBuckets unions DB and client keys', () => {
    expect(
      mergeCompanionSlotFavoriteBuckets({ signal: true }, { grounding: true, signal: false }),
    ).toEqual({ signal: false, grounding: true });
  });
});
