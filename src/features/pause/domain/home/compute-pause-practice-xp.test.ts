import { describe, expect, it } from 'vitest';
import {
  computePausePracticeXpForInstance,
  computePresenceXpFromCompletedPauses,
  PAUSE_PRACTICE_BASE_XP,
  PAUSE_PRACTICE_MAX_BONUS_XP,
} from './compute-pause-practice-xp';

describe('computePresenceXpFromCompletedPauses', () => {
  it('sums base XP plus capped ritual bonuses per completed pause', () => {
    const instances = [{ id: 'a', context: null }, { id: 'b', context: null }];
    const events = new Map([
      [
        'a',
        [
          { step_type: 'breath_completed', payload: {} },
          { step_type: 'initial_emotion_logged', payload: { mood: 'anxious' } },
          { step_type: 'post_pause_emotion_logged', payload: { mood: 'calm' } },
        ],
      ],
      [
        'b',
        [
          { step_type: 'initial_emotion_logged', payload: { mood: 'fomo', brief_ritual: true } },
          { step_type: 'outcome_logged', payload: { outcome: 'held' } },
        ],
      ],
    ]);
    const companions = new Map([['a', 2]]);

    const xp = computePresenceXpFromCompletedPauses(instances, events, companions);

    // a: base 2 + min(breath 1 + tools 2, cap 3) = 5
    // b: base 2 + min(brief decision 1 + entry mood 1, cap 3) = 4
    expect(xp).toBe(9);
    expect(PAUSE_PRACTICE_BASE_XP).toBe(2);
    expect(PAUSE_PRACTICE_MAX_BONUS_XP).toBe(3);
  });

  it('caps a rich ritual at base + max bonus', () => {
    const xp = computePausePracticeXpForInstance(
      [
        { step_type: 'breath_completed', payload: {} },
        { step_type: 'note_updated', payload: {} },
        { step_type: 'tag_updated', payload: {} },
      ],
      null,
      3,
    );
    expect(xp).toBe(PAUSE_PRACTICE_BASE_XP + PAUSE_PRACTICE_MAX_BONUS_XP);
  });

  it('returns zero when there are no completed pauses', () => {
    expect(computePresenceXpFromCompletedPauses([], new Map(), new Map())).toBe(0);
  });
});
