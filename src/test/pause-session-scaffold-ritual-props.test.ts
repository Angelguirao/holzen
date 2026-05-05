import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';

const t = ((
  key: string,
  opts?: { defaultValue?: string; n?: number; total?: number },
): string => {
  if (key === 'pause.brief.sessionTitle') return 'Brief title';
  if (key === 'pause.deep.sessionTitle') return 'Deep title';
  if (key === 'pause.deep.macroStepCount') return `${opts?.n ?? '?'} of ${opts?.total ?? '?'}`;
  if (key === 'pause.deep.feelStepDurationHint') return '~ 15 sec';
  return key;
}) as TFunction;

describe('buildPauseSessionScaffoldRitualDerived', () => {
  it('brief: no macro index, session title', () => {
    expect(
      buildPauseSessionScaffoldRitualDerived({
        ritualEntry: 'brief',
        step: 'feel',
        t,
      }),
    ).toEqual({
      macroStepIndex: undefined,
      macroStepTotal: undefined,
      sessionTitle: 'Brief title',
    });
  });

  it('deep: macro lines + session title on breath', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'breathe',
      t,
    });
    expect(d.macroStepIndex).toBe(2);
    expect(d.macroStepTotal).toBeGreaterThan(0);
    expect(d.sessionTitle).toBe('Deep title');
    expect(d.macroProgressLine).toBe('2 of 6');
    expect(d.macroProgressSubline).toBeUndefined();
  });

  it('deep feel: duration hint under macro step count', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'feel',
      t,
    });
    expect(d.macroProgressLine).toBe('1 of 6');
    expect(d.macroProgressSubline).toBe('~ 15 sec');
  });

  it('picker follows deep scaffold rules (same ternary as pre-refactor PauseSession)', () => {
    const p = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'picker',
      step: 'reflect',
      t,
    });
    expect(p.macroStepIndex).toBe(3);
  });
});
