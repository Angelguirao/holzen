import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';

const t = ((
  key: string,
  opts?: { defaultValue?: string; n?: number; total?: number },
): string => {
  if (key === 'pause.brief.sessionTitle') return 'Brief title';
  if (key === 'pause.brief.macroStepCount') return `${opts?.n ?? '?'} of ${opts?.total ?? '?'}`;
  if (key === 'pause.brief.feelStepDurationHint') return '~ 15 sec';
  if (key === 'pause.brief.breathStepDurationHint') return '< 1 min';
  if (key === 'pause.brief.integrateStepDurationHint') return '~ 20 sec';
  if (key === 'pause.deep.sessionTitle') return 'Deep title';
  if (key === 'pause.deep.macroStepCount') return `${opts?.n ?? '?'} of ${opts?.total ?? '?'}`;
  if (key === 'pause.deep.feelStepDurationHint') return '~ 15 sec';
  if (key === 'pause.deep.breatheStepDurationHint') return '< 1 min';
  if (key === 'pause.deep.breatheStepDurationHintCalming') return '~ 1 min';
  if (key === 'pause.deep.breath2StepDurationHint') return '< 1 min';
  return key;
}) as TFunction;

describe('buildPauseSessionScaffoldRitualDerived', () => {
  it('brief feel: macro count + duration under, session title', () => {
    expect(
      buildPauseSessionScaffoldRitualDerived({
        ritualEntry: 'brief',
        step: 'feel',
        briefStep: 'feel',
        t,
      }),
    ).toEqual({
      macroStepIndex: 1,
      macroStepTotal: 4,
      sessionTitle: 'Brief title',
      macroProgressLine: '1 of 4',
      macroProgressSubline: '~ 15 sec',
    });
  });

  it('brief breath: macro count + breath duration hint', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'brief',
      step: 'feel',
      briefStep: 'breath',
      t,
    });
    expect(d.macroProgressLine).toBe('2 of 4');
    expect(d.macroProgressSubline).toBe('< 1 min');
  });

  it('brief integrate: macro count + integrate duration hint', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'brief',
      step: 'feel',
      briefStep: 'integrate',
      t,
    });
    expect(d.macroProgressLine).toBe('3 of 4');
    expect(d.macroProgressSubline).toBe('~ 20 sec');
  });

  it('brief without briefStep: title only (macro unset)', () => {
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

  it('deep: macro lines + session title on breath (box pattern hint)', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'breathe',
      t,
    });
    expect(d.macroStepIndex).toBe(2);
    expect(d.macroStepTotal).toBeGreaterThan(0);
    expect(d.sessionTitle).toBe('Deep title');
    expect(d.macroProgressLine).toBe('2 of 6');
    expect(d.macroProgressSubline).toBe('< 1 min');
  });

  it('deep breathe high severity: calming duration hint', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'breathe',
      severity: 'high',
      t,
    });
    expect(d.macroProgressSubline).toBe('~ 1 min');
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
