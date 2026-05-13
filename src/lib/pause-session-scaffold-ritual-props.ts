import type { TFunction } from 'i18next';
import type { PauseStep } from '@/components/pause/PauseProgress';
import { PAUSE_DEEP_DISPLAY_STEP_COUNT, pauseDeepMacroStepNumber } from '@/components/pause/PauseProgress';
import { computeBriefMacroProgressPosition } from '@/lib/brief-pause-order';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

type PauseSeverity = 'mild' | 'moderate' | 'high';

function deepPauseMacroSubline(step: PauseStep, severity: PauseSeverity, t: TFunction): string | undefined {
  if (step === 'feel') {
    return t('pause.deep.feelStepDurationHint', { defaultValue: '~ 15 sec' });
  }
  if (step === 'breathe') {
    return severity === 'high'
      ? t('pause.deep.breatheStepDurationHintCalming', { defaultValue: '~ 1 min' })
      : t('pause.deep.breatheStepDurationHint', { defaultValue: '< 1 min' });
  }
  if (step === 'breath2') {
    return t('pause.deep.breath2StepDurationHint', { defaultValue: '< 1 min' });
  }
  return undefined;
}

/**
 * Non-JSX scaffold props (macro index, session title) derived from ritual depth + step.
 * Complements `pause-session-scaffold-ritual-payloads.ts` (brief/deep body slots).
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
  /** Used for deep pause breathe-step duration hints (box vs calming pattern). */
  severity?: PauseSeverity;
  t: TFunction;
}): PauseSessionScaffoldRitualDerived {
  const { ritualEntry, step, briefStep, severity = 'mild', t } = input;
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
            ? t('pause.brief.feelStepDurationHint', { defaultValue: '~ 15 sec' })
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
      macroProgressSubline: deepPauseMacroSubline(step, severity, t),
    };
  }
  return {
    ...base,
    sessionTitle: undefined,
  };
}
