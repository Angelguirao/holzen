import { describe, expect, it } from 'vitest';
import {
  resolveScoreImpactDisplayImpacts,
  resolveScoreImpactViewMode,
} from '@/features/pause/application/use-cases/score-impact-presentation';
import type { PauseScoreImpactRow } from '@/features/pause/application/use-cases/score-impacts';

const row = (key: string): PauseScoreImpactRow => ({
  key,
  label: key,
  direction: 'up',
  reason: 'r',
  points: 1,
});

describe('score-impact-presentation', () => {
  it('resolveScoreImpactDisplayImpacts excludes first row when asked', () => {
    const impacts = [row('a'), row('b')];
    expect(resolveScoreImpactDisplayImpacts(impacts, true)).toHaveLength(1);
    expect(resolveScoreImpactDisplayImpacts(impacts, true)[0]?.key).toBe('b');
  });

  it('default variant hides when no impacts', () => {
    expect(
      resolveScoreImpactViewMode({ impacts: [], variant: 'default', excludeFirstFromList: false }),
    ).toBe('hidden');
  });

  it('brief variant shows empty state when no impacts', () => {
    expect(
      resolveScoreImpactViewMode({ impacts: [], variant: 'brief', excludeFirstFromList: false }),
    ).toBe('brief_empty');
  });

  it('brief hides when excludeFirst leaves no rows', () => {
    expect(
      resolveScoreImpactViewMode({
        impacts: [row('only')],
        variant: 'brief',
        excludeFirstFromList: true,
      }),
    ).toBe('brief_hidden');
  });
});
