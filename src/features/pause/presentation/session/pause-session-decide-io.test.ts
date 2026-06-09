import { describe, expect, it } from 'vitest';
import type { PauseImpactData } from './pause-session-decide-io';

describe('pause-session-decide-io', () => {
  it('re-exports PauseImpactData for session ritual state', () => {
    const sample: PauseImpactData = {
      mood: null,
      moodAfter: null,
      breathingCompleted: true,
      decision: 'hold',
      context: null,
      engagedTools: 0,
      wroteNote: false,
      usedTags: false,
      ritualDepth: 'deep',
    };
    expect(sample.decision).toBe('hold');
  });
});
