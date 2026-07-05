import { describe, expect, it } from 'vitest';
import {
  buildPracticeXpSignalRows,
  mapPracticeXpBySignalRpc,
  sumPracticeXpBySignal,
} from './practice-xp-by-signal';

describe('mapPracticeXpBySignalRpc', () => {
  it('maps v2 signal keys from RPC', () => {
    const signals = mapPracticeXpBySignalRpc({
      base_brief: 50,
      base_deep: 120,
      favorite: 10,
      note: 9,
      companions: 12,
      companion_favorites: 4,
      breath_second: 8,
      shift_mood: 6,
    });
    expect(signals.base_brief).toBe(50);
    expect(signals.base_deep).toBe(120);
    expect(sumPracticeXpBySignal(signals)).toBe(219);
  });
});

describe('buildPracticeXpSignalRows', () => {
  it('omits zero signals and sorts by xp', () => {
    const rows = buildPracticeXpSignalRows(
      {
        base_brief: 0,
        base_deep: 18,
        favorite: 2,
        note: 0,
        companions: 4,
        companion_favorites: 0,
        breath_second: 0,
        shift_mood: 3,
        post_pause_check_in: 0,
      },
      27,
    );
    expect(rows.map((r) => r.key)).toEqual(['base_deep', 'companions', 'shift_mood', 'favorite']);
    expect(rows[0].sharePercent).toBe(Math.round((18 / 27) * 100));
  });
});
