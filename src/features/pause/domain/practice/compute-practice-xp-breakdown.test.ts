import { describe, expect, it } from 'vitest';
import {
  computePracticeXpBreakdown,
  sumPracticeXpBreakdown,
} from './compute-practice-xp-breakdown';

const instanceId = 'pi-1';

describe('computePracticeXpBreakdown', () => {
  it('awards brief base only with no deep bonuses', () => {
    const signals = computePracticeXpBreakdown({
      instanceId,
      engagedTools: 2,
      events: [
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm', brief_ritual: true } },
        { step_type: 'breath_completed', payload: { breath_segment: 1, brief_ritual: true } },
        { step_type: 'outcome_logged', payload: { outcome: 'held' } },
        { step_type: 'favorite_toggled', payload: { is_favorite: true } },
      ],
    });
    expect(signals.base_brief).toBe(10);
    expect(signals.base_deep).toBe(0);
    expect(signals.favorite).toBe(0);
    expect(sumPracticeXpBreakdown(signals)).toBe(10);
  });

  it('awards deep base plus optional bonuses', () => {
    const signals = computePracticeXpBreakdown({
      instanceId,
      engagedTools: 2,
      instanceMetadata: { companion_slot_favorites: { signal: true } },
      events: [
        { step_type: 'initial_emotion_logged', payload: { mood: 'anxious' } },
        { step_type: 'breath_completed', payload: { breath_segment: 1 } },
        { step_type: 'reflection_step', payload: {} },
        { step_type: 'shift_emotion_logged', payload: { mood: 'calm' } },
        { step_type: 'breath_completed', payload: { breath_segment: 2 } },
        { step_type: 'favorite_toggled', payload: { is_favorite: true } },
        { step_type: 'note_updated', payload: { text: 'note' } },
        { step_type: 'outcome_logged', payload: { outcome: 'held' } },
      ],
    });
    expect(signals.base_deep).toBe(18);
    expect(signals.favorite).toBe(2);
    expect(signals.note).toBe(3);
    expect(signals.companions).toBe(4);
    expect(signals.companion_favorites).toBe(2);
    expect(signals.breath_second).toBe(4);
    expect(signals.shift_mood).toBe(3);
    expect(sumPracticeXpBreakdown(signals)).toBe(18 + 2 + 3 + 4 + 2 + 4 + 3);
  });

  it('does not award second-breath bonus when segment 2 was skipped', () => {
    const signals = computePracticeXpBreakdown({
      instanceId,
      engagedTools: 0,
      events: [
        { step_type: 'initial_emotion_logged', payload: { mood: 'calm' } },
        { step_type: 'breath_completed', payload: { breath_segment: 1 } },
        { step_type: 'reflection_step', payload: {} },
        { step_type: 'shift_emotion_logged', payload: { from_frame_hub: true } },
        { step_type: 'breath_completed', payload: { breath_segment: 2, skipped: true } },
        { step_type: 'outcome_logged', payload: { outcome: 'held' } },
      ],
    });
    expect(signals.breath_second).toBe(0);
    expect(signals.shift_mood).toBe(0);
    expect(signals.base_deep).toBe(18);
  });

  it('returns zeros when ritual beats are incomplete', () => {
    const signals = computePracticeXpBreakdown({
      instanceId,
      engagedTools: 0,
      events: [{ step_type: 'outcome_logged', payload: { outcome: 'held' } }],
    });
    expect(sumPracticeXpBreakdown(signals)).toBe(0);
  });
});
