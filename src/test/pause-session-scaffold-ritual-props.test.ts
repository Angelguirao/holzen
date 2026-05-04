import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { buildPauseSessionScaffoldRitualDerived } from '@/lib/pause-session-scaffold-ritual-props';

const t = ((key: string) => (key === 'pause.brief.sessionTitle' ? 'Brief title' : key)) as TFunction;

describe('buildPauseSessionScaffoldRitualDerived', () => {
  it('brief: no macro index, session title, science maps brief step, hide on breath', () => {
    expect(
      buildPauseSessionScaffoldRitualDerived({
        ritualEntry: 'brief',
        step: 'feel',
        briefStep: 'feel',
        t,
      }),
    ).toEqual({
      macroStepIndex: undefined,
      macroStepTotal: undefined,
      sessionTitle: 'Brief title',
      scienceCurrentStep: 'feel',
      hideScienceButton: false,
    });
    expect(
      buildPauseSessionScaffoldRitualDerived({
        ritualEntry: 'brief',
        step: 'feel',
        briefStep: 'breath',
        t,
      }).hideScienceButton,
    ).toBe(true);
  });

  it('deep: macro from STEPS, no session title override, hide science on breath steps', () => {
    const d = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'breathe',
      briefStep: 'feel',
      t,
    });
    expect(d.macroStepIndex).toBe(2);
    expect(d.macroStepTotal).toBeGreaterThan(0);
    expect(d.sessionTitle).toBeUndefined();
    expect(d.scienceCurrentStep).toBeUndefined();
    expect(d.hideScienceButton).toBe(true);
  });

  it('picker follows deep scaffold rules (same ternary as pre-refactor PauseSession)', () => {
    const p = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'picker',
      step: 'reflect',
      briefStep: 'feel',
      t,
    });
    expect(p.macroStepIndex).toBe(3);
    expect(p.hideScienceButton).toBe(false);
  });
});
