import { describe, expect, it } from 'vitest';
import { isPostPauseEmotionDirty } from './post-pause-emotion-log';

describe('isPostPauseEmotionDirty', () => {
  it('is dirty when initial snapshot is missing', () => {
    expect(isPostPauseEmotionDirty({ mood: 'calm', intensity: 3 }, null)).toBe(true);
  });

  it('is dirty when mood or intensity changed', () => {
    expect(
      isPostPauseEmotionDirty(
        { mood: 'fomo', intensity: 3 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(true);
    expect(
      isPostPauseEmotionDirty(
        { mood: 'calm', intensity: 4 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(true);
  });

  it('is clean when unchanged from snapshot', () => {
    expect(
      isPostPauseEmotionDirty(
        { mood: 'calm', intensity: 3 },
        { mood: 'calm', intensity: 3 },
      ),
    ).toBe(false);
  });
});
