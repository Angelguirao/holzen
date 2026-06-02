import { describe, expect, it } from 'vitest';
import {
  buildPracticeXpSignalRows,
  mapPracticeXpBySignalRpc,
  sumPracticeXpBySignal,
} from './practice-xp-by-signal';

describe('mapPracticeXpBySignalRpc', () => {
  it('maps snake_case keys from RPC', () => {
    const signals = mapPracticeXpBySignalRpc({
      base: 50,
      breath: 40,
      mood_regulation: 10,
      tools: 12,
      reflection: 9,
      brief_decision: 4,
      brief_entry_mood: 2,
    });
    expect(signals.base).toBe(50);
    expect(signals.breath).toBe(40);
    expect(sumPracticeXpBySignal(signals)).toBe(127);
  });
});

describe('buildPracticeXpSignalRows', () => {
  it('omits zero signals and sorts by xp', () => {
    const rows = buildPracticeXpSignalRows(
      {
        base: 10,
        breath: 8,
        mood_regulation: 0,
        tools: 4,
        reflection: 0,
        brief_decision: 0,
        brief_entry_mood: 0,
      },
      22,
    );
    expect(rows.map((r) => r.key)).toEqual(['base', 'breath', 'tools']);
    expect(rows[0].sharePercent).toBe(Math.round((10 / 22) * 100));
  });
});
