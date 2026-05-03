import type { TFunction } from 'i18next';
import type { PauseStep } from '@/components/pause/PauseProgress';
import { PAUSE_DEEP_DISPLAY_STEP_COUNT, pauseDeepMacroStepNumber } from '@/components/pause/PauseProgress';
import { briefStepToPauseScienceStep } from '@/lib/pause-session-step-map';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

/** Props fragment for `PauseSessionScaffold` that depend on brief vs deep ritual (not JSX slots). */
export type PauseSessionScaffoldRitualDerived = {
  macroStepIndex?: number;
  macroStepTotal?: number;
  sessionTitle?: string;
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
  return {
    macroStepIndex: pauseDeepMacroStepNumber(step),
    macroStepTotal: PAUSE_DEEP_DISPLAY_STEP_COUNT,
    sessionTitle: undefined,
    scienceCurrentStep: undefined,
    hideScienceButton: step === 'breathe' || step === 'breath2',
  };
}
