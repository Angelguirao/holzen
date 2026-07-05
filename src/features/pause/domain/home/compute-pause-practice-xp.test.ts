import { describe, expect, it } from 'vitest';
import {
  computePausePracticeXpForInstance,
  computePresenceXpFromCompletedPauses,
} from './compute-pause-practice-xp';
import { PRACTICE_XP_BRIEF_BASE } from '@/features/pause/domain/practice/practice-xp-constants';

describe('computePresenceXpFromCompletedPauses', () => {
  it('sums brief base and deep base+bonuses for valid rituals', () => {
    const instances = [
      { id: 'a', context: null },
      { id: 'b', context: null, metadata: {} },
    ];
    const events = new Map([
      [
        'a',
        [
          { step_type: 'initial_emotion_logged', payload: { mood: 'calm', brief_ritual: true } },
          { step_type: 'breath_completed', payload: { breath_segment: 1, brief_ritual: true } },
          { step_type: 'outcome_logged', payload: { outcome: 'held' } },
        ],
      ],
      [
        'b',
        [
          { step_type: 'initial_emotion_logged', payload: { mood: 'anxious' } },
          { step_type: 'breath_completed', payload: { breath_segment: 1 } },
          { step_type: 'reflection_step', payload: {} },
          { step_type: 'shift_emotion_logged', payload: { mood: 'calm' } },
          { step_type: 'breath_completed', payload: { breath_segment: 2 } },
          { step_type: 'outcome_logged', payload: { outcome: 'held' } },
        ],
      ],
    ]);
    const companions = new Map([['b', 1]]);

    const xp = computePresenceXpFromCompletedPauses(instances, events, companions);

    // a: brief base 10
    // b: deep base 18 + companions 2 + shift mood 3 + second breath 4
    expect(xp).toBe(37);
    expect(PRACTICE_XP_BRIEF_BASE).toBe(10);
  });

  it('awards deep optional stack without artificial cap', () => {
    const xp = computePausePracticeXpForInstance(
      [
        { step_type: 'initial_emotion_logged', payload: { mood: 'fomo' } },
        { step_type: 'breath_completed', payload: { breath_segment: 1 } },
        { step_type: 'reflection_step', payload: {} },
        { step_type: 'shift_emotion_logged', payload: { mood: 'calm' } },
        { step_type: 'breath_completed', payload: { breath_segment: 2 } },
        { step_type: 'favorite_toggled', payload: { is_favorite: true } },
        { step_type: 'note_updated', payload: { text: 'x' } },
        { step_type: 'outcome_logged', payload: { outcome: 'held' } },
      ],
      null,
      3,
      'deep-1',
      { companion_slot_favorites: { ground: true, signal: true } },
    );
    expect(xp).toBe(18 + 2 + 3 + 6 + 4 + 4 + 3);
  });

  it('returns zero when there are no completed pauses', () => {
    expect(computePresenceXpFromCompletedPauses([], new Map(), new Map())).toBe(0);
  });
});
