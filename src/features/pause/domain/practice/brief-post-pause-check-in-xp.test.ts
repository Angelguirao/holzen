import { describe, expect, it } from 'vitest';
import { briefPostPauseCheckInXpFromEvents } from './brief-post-pause-check-in-xp';

describe('briefPostPauseCheckInXpFromEvents', () => {
  it('returns 0 when post_pause_emotion_logged is missing', () => {
    expect(
      briefPostPauseCheckInXpFromEvents([
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm', intensity: 3 } },
      ]),
    ).toBe(0);
  });

  it('returns 0 when post check-in matches initial feel', () => {
    expect(
      briefPostPauseCheckInXpFromEvents([
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm', intensity: 3 } },
        { step_type: 'post_pause_emotion_logged', payload: { mood: 'calm', intensity: 3 } },
      ]),
    ).toBe(0);
  });

  it('returns +5 when mood changed on post check-in', () => {
    expect(
      briefPostPauseCheckInXpFromEvents([
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm', intensity: 3 } },
        { step_type: 'post_pause_emotion_logged', payload: { mood: 'anxious', intensity: 4 } },
      ]),
    ).toBe(5);
  });

  it('returns +5 when only intensity changed', () => {
    expect(
      briefPostPauseCheckInXpFromEvents([
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm', intensity: 2 } },
        { step_type: 'post_pause_emotion_logged', payload: { mood: 'calm', intensity: 4 } },
      ]),
    ).toBe(5);
  });
});
