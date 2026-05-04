import { describe, expect, it } from 'vitest';
import { BRIEF_PAUSE_ORDER, computeBriefMacroProgressPosition } from '@/lib/brief-pause-order';

describe('computeBriefMacroProgressPosition', () => {
  it('is 1-based within BRIEF_PAUSE_ORDER', () => {
    expect(computeBriefMacroProgressPosition('feel')).toEqual({ n: 1, total: BRIEF_PAUSE_ORDER.length });
    expect(computeBriefMacroProgressPosition('breath')).toEqual({ n: 2, total: BRIEF_PAUSE_ORDER.length });
    expect(computeBriefMacroProgressPosition('decide')).toEqual({ n: 4, total: BRIEF_PAUSE_ORDER.length });
  });
});
