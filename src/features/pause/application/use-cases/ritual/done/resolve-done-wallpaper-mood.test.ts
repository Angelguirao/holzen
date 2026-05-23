import { describe, expect, it } from 'vitest';
import { resolveDoneWallpaperMood } from './resolve-done-wallpaper-mood';

describe('resolveDoneWallpaperMood', () => {
  it('prefers moodAfter when valid', () => {
    expect(
      resolveDoneWallpaperMood({ mood: 'calm', moodAfter: 'anxious' }),
    ).toBe('anxious');
  });

  it('falls back to mood when moodAfter missing', () => {
    expect(resolveDoneWallpaperMood({ mood: 'calm', moodAfter: null })).toBe('calm');
  });

  it('returns null for invalid or missing moods', () => {
    expect(resolveDoneWallpaperMood(null)).toBeNull();
    expect(resolveDoneWallpaperMood({ mood: 'not-a-mood', moodAfter: null })).toBeNull();
  });
});
