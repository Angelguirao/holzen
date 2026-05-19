import type { TFunction } from 'i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { PAUSE_DEEP_DISPLAY_STEP_COUNT, pauseDeepMacroStepNumber } from '@/screens/pause/components/PauseProgress';
import { computeBriefMacroProgressPosition } from '@/features/pause/application/brief-ritual/brief-pause-order';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';

type PauseSeverity = 'mild' | 'moderate' | 'high';

function macroProgressStepCompletedLine(t: TFunction): string {
  return t('pause.macroProgressStepCompleted', { defaultValue: 'Completed' });
}

function deepPauseMacroSubline(
  step: PauseStep,
  t: TFunction,
  input: { moodDone: boolean; breathingFirstCompleted: boolean; breathingSecondCompleted: boolean },
): string | undefined {
  if (step === 'feel') {
    return input.moodDone
      ? macroProgressStepCompletedLine(t)
      : t('pause.deep.feelStepDurationHint', { defaultValue: '~ 15 sec' });
  }
  if (step === 'breathe') {
    return input.breathingFirstCompleted
      ? macroProgressStepCompletedLine(t)
      : t('pause.deep.breatheStepDurationHint', { defaultValue: '< 1 min' });
  }
  if (step === 'breath2') {
    return input.breathingSecondCompleted
      ? macroProgressStepCompletedLine(t)
      : t('pause.deep.breath2StepDurationHint', { defaultValue: '< 30 sec' });
  }
  if (step === 'reflect') {
    return t('pause.deep.reflectStepDurationHint', { defaultValue: '~ 3 min' });
  }
  if (step === 'frame') {
    return t('pause.reflect.subtitle', { defaultValue: 'Take your time' });
  }
  if (step === 'decide') {
    return t('pause.brief.decideStepDurationHint', { defaultValue: '< 15 sec' });
  }
  return undefined;
}

/**
 * Non-JSX scaffold props (macro index, session title) derived from ritual depth + step.
 * Complements scaffold ritual payloads (brief/deep body slots).
 *
 * **Call site:** `src/pages/PauseSession.tsx`. **Code map:** `docs/systems/pause-system.md` section 10.
 */

/** Props fragment for `PauseSessionScaffold` that depend on brief vs deep ritual (not JSX slots). */
export type PauseSessionScaffoldRitualDerived = {
  macroStepIndex?: number;
  macroStepTotal?: number;
  sessionTitle?: string;
  /** Brief/deep: first line is “{{n}} of {{total}}” (no “Step”); optional duration line below key steps. */
  macroProgressLine?: string;
  macroProgressSubline?: string;
};

export function buildPauseSessionScaffoldRitualDerived(input: {
  ritualEntry: RitualDepth | 'picker';
  step: PauseStep;
  /** Required when `ritualEntry === 'brief'` so macro lines use the two-line scaffold layout. */
  briefStep?: BriefPauseStep;
  /** Retained for scaffold callers; breathe duration hint is triangle-only for all severities. */
  severity?: PauseSeverity;
  /** When the Feel step has a confirmed mood (wireframe: macro subline “Completed”). */
  moodDone?: boolean;
  /** Deep first Breathe: pattern finished, interstitial showing. */
  breathingFirstCompleted?: boolean;
  /** Deep second Breathe: pattern finished, interstitial showing. */
  breathingSecondCompleted?: boolean;
  t: TFunction;
}): PauseSessionScaffoldRitualDerived {
  const {
    ritualEntry,
    step,
    briefStep,
    severity = 'mild',
    moodDone = false,
    breathingFirstCompleted = false,
    breathingSecondCompleted = false,
    t,
  } = input;
  void severity;
  if (ritualEntry === 'brief') {
    if (briefStep != null) {
      const { n, total } = computeBriefMacroProgressPosition(briefStep);
      return {
        macroStepIndex: n,
        macroStepTotal: total,
        sessionTitle: t('pause.brief.sessionTitle'),
        macroProgressLine: t('pause.brief.macroStepCount', {
          defaultValue: '{{n}} of {{total}}',
          n,
          total,
        }),
        macroProgressSubline:
          briefStep === 'feel'
            ? moodDone
              ? macroProgressStepCompletedLine(t)
              : t('pause.brief.feelStepDurationHint', { defaultValue: '~ 15 sec' })
            : briefStep === 'breath'
              ? t('pause.brief.breathStepDurationHint', { defaultValue: '< 1 min' })
              : briefStep === 'integrate'
              ? t('pause.brief.integrateStepDurationHint', { defaultValue: '~ 20 sec' })
              : briefStep === 'decide'
                ? t('pause.brief.decideStepDurationHint', { defaultValue: '< 15 sec' })
                : undefined,
      };
    }
    return {
      macroStepIndex: undefined,
      macroStepTotal: undefined,
      sessionTitle: t('pause.brief.sessionTitle'),
    };
  }
  const macroStepIndex = pauseDeepMacroStepNumber(step);
  const macroStepTotal = PAUSE_DEEP_DISPLAY_STEP_COUNT;
  const base = {
    macroStepIndex,
    macroStepTotal,
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
      macroProgressSubline: deepPauseMacroSubline(step, t, {
        moodDone,
        breathingFirstCompleted,
        breathingSecondCompleted,
      }),
    };
  }
  return {
    ...base,
    sessionTitle: undefined,
  };
}
