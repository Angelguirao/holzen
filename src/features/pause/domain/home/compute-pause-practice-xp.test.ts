import { describe, expect, it } from 'vitest';
import {
  computePausePracticeXpForInstance,
  computePresenceXpFromCompletedPauses,
  PAUSE_PRACTICE_BASE_XP,
} from './compute-pause-practice-xp';

describe('computePresenceXpFromCompletedPauses', () => {
  it('sums base XP plus Done-aligned ritual bonuses per completed pause', () => {
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

    // a: base 5 + breath 4 + tools 4 = 13 (mood bonus skipped when breathing counts)
    // b: base 5 + brief decision 2 + brief entry mood 2 = 9
    expect(xp).toBe(22);
    expect(PAUSE_PRACTICE_BASE_XP).toBe(5);
  });

  it('rewards a rich deep ritual without an artificial cap', () => {
    const xp = computePausePracticeXpForInstance(
      [
        { step_type: 'breath_completed', payload: {} },
        { step_type: 'note_updated', payload: {} },
        { step_type: 'tag_updated', payload: {} },
      ],
      null,
      3,
    );
    // base 5 + breath 4 + note/tags 3 + tools 6 = 18
    expect(xp).toBe(18);
  });

  it('returns zero when there are no completed pauses', () => {
    expect(computePresenceXpFromCompletedPauses([], new Map(), new Map())).toBe(0);
  });
});
