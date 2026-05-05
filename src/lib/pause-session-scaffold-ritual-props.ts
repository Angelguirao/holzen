import type { TFunction } from 'i18next';
import type { PauseStep } from '@/components/pause/PauseProgress';
import { PAUSE_DEEP_DISPLAY_STEP_COUNT, pauseDeepMacroStepNumber } from '@/components/pause/PauseProgress';
import { briefStepToPauseScienceStep } from '@/lib/pause-session-step-map';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

/**
 * Non-JSX scaffold props (macro index, session title, science step, science button visibility) derived
 * from ritual depth + step. Complements `pause-session-scaffold-ritual-payloads.ts` (brief/deep body slots).
 *
 * **Call site:** `src/pages/PauseSession.tsx`. **Code map:** `docs/systems/pause-system.md` section 10.
 */

/** Props fragment for `PauseSessionScaffold` that depend on brief vs deep ritual (not JSX slots). */
export type PauseSessionScaffoldRitualDerived = {
  macroStepIndex?: number;
  macroStepTotal?: number;
  sessionTitle?: string;
  /** Deep pause: “{{n}} of {{total}}” under title; brief uses `briefMacroLine` from the page instead. */
  macroProgressLine?: string;
  macroProgressSubline?: string;
  scienceCurrentStep?: PauseStep;
  hideScienceButton: boolean;
};

export function buildPauseSessionScaffoldRitualDerived(input: {
  ritualEntry: RitualDepth | 'picker';
  step: PauseStep;
  briefStep: BriefPauseStep;
  t: TFunction;
}): PauseSessionScaffoldRitualDerived {
  const { ritualEntry, step, briefStep, t } = input;
  if (ritualEntry === 'brief') {
    return {
      macroStepIndex: undefined,
      macroStepTotal: undefined,
      sessionTitle: t('pause.brief.sessionTitle'),
      scienceCurrentStep: briefStepToPauseScienceStep(briefStep),
      hideScienceButton: briefStep === 'breath',
    };
  }
  const macroStepIndex = pauseDeepMacroStepNumber(step);
  const macroStepTotal = PAUSE_DEEP_DISPLAY_STEP_COUNT;
  const base = {
    macroStepIndex,
    macroStepTotal,
    scienceCurrentStep: undefined,
    hideScienceButton: step === 'breathe' || step === 'breath2',
  };
  if (ritualEntry === 'deep') {
    return {
      ...base,
      sessionTitle: t('pause.deep.sessionTitle', { defaultValue: 'Your deep pause' }),
      macroProgressLine: t('pause.deep.macroStepCount', {
        defaultValue: '{{n}} of {{total}}',
        n: macroStepIndex,
        total: macroStepTotal,
      }),
      macroProgressSubline:
        step === 'feel'
          ? t('pause.deep.feelStepDurationHint', { defaultValue: '~ 15 sec' })
          : undefined,
    };
  }
  return {
    ...base,
    sessionTitle: undefined,
  };
}
