import { describe, expect, it } from 'vitest';
import {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
} from './initial-emotion-log';

describe('buildInitialEmotionLoggedPayload', () => {
  it('omits intensity when undefined', () => {
    expect(buildInitialEmotionLoggedPayload('calm', undefined)).toEqual({ mood: 'calm' });
  });

  it('includes intensity when provided', () => {
    expect(buildInitialEmotionLoggedPayload('fomo', 4)).toEqual({ mood: 'fomo', intensity: 4 });
  });

  it('adds brief flags', () => {
    expect(
      buildInitialEmotionLoggedPayload('calm', 2, { briefRitual: true, briefFace: 'anxious' }),
    ).toEqual({
      mood: 'calm',
      intensity: 2,
      brief_ritual: true,
      brief_face: 'anxious',
    });
  });
});

describe('initialEmotionLogDedupeKey', () => {
  it('appends _bf for dedupe parity with PauseSession', () => {
    const p = { mood: 'calm', intensity: 2 };
    expect(initialEmotionLogDedupeKey(p, 'anxious')).toBe(
      JSON.stringify({ ...p, _bf: 'anxious' }),
    );
  });
});

describe('initial emotion skip helpers', () => {
  it('matches fixed skip payload and key', () => {
    expect(initialEmotionSkippedLoggedPayload()).toEqual({ skipped: true });
    expect(initialEmotionSkippedLogDedupeKey()).toBe(JSON.stringify({ skipped: true }));
  });
});
