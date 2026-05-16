import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/** Full deep-ritual routing order (matches header stepper beats). */
const STEPS = ['feel', 'breathe', 'reflect', 'frame', 'breath2', 'decide'] as const;
export type PauseStep = (typeof STEPS)[number];

/** Six segments in the deep-pause shell. */
const PAUSE_DEEP_DISPLAY_STEPS = ['feel', 'breathe', 'reflect', 'frame', 'breath2', 'decide'] as const;

export const PAUSE_DEEP_DISPLAY_STEP_COUNT = PAUSE_DEEP_DISPLAY_STEPS.length;

/** 1-based “Step n of 6” for the meta line. */
export function pauseDeepMacroStepNumber(step: PauseStep): number {
  if (step === 'decide') return PAUSE_DEEP_DISPLAY_STEP_COUNT;
  return STEPS.indexOf(step) + 1;
}

function pauseDeepDisplayProgressIndex(step: PauseStep): number {
  if (step === 'decide') {
    return PAUSE_DEEP_DISPLAY_STEPS.indexOf('decide');
  }
  return PAUSE_DEEP_DISPLAY_STEPS.indexOf(step as (typeof PAUSE_DEEP_DISPLAY_STEPS)[number]);
}

interface Props {
  currentStep: PauseStep;
  /** `segment` = full-width macro bars (pause shell); `pill` = compact dash stepper. */
  variant?: 'segment' | 'pill';
  /** Variant B: macro step 5 labeled “Shift” instead of repeating “Breathe”. */
  breathSecondLabelVariant?: 'breathe' | 'shift';
}

/** Deep pause header stepper: visual progress only (no step jumping). */
export function PauseProgress({
  currentStep,
  variant = 'segment',
  breathSecondLabelVariant = 'breathe',
}: Props) {
  const { t } = useTranslation();
  const breath2Label =
    breathSecondLabelVariant === 'shift'
      ? t('pause.steps.shift', { defaultValue: 'Shift' })
      : t('pause.steps.breath2', { defaultValue: 'Breathe' });
  const displayLabels: Record<(typeof PAUSE_DEEP_DISPLAY_STEPS)[number], string> = {
    feel: t('pause.steps.feel', { defaultValue: 'Feel' }),
    breathe: t('pause.steps.breathe', { defaultValue: 'Breathe' }),
    reflect: t('pause.steps.reflect', { defaultValue: 'Reflect' }),
    frame: t('pause.steps.frame', { defaultValue: 'Frame' }),
    breath2: breath2Label,
    decide: t('pause.steps.decide', { defaultValue: 'Decide' }),
  };

  const currentIndex = pauseDeepDisplayProgressIndex(currentStep);

  if (variant === 'pill') {
    return (
      <div className="flex w-max min-w-full items-center justify-start gap-1 sm:gap-1.5" role="list">
        {PAUSE_DEEP_DISPLAY_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <div
              key={step}
              role="listitem"
              className="flex min-w-[2.75rem] flex-col items-center gap-1.5 px-0.5 sm:min-w-0"
              aria-current={isActive ? 'step' : undefined}
            >
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  isActive ? 'w-6 bg-nox-text-link' : isPast ? 'w-4 bg-nox-text-link/40' : 'w-3 bg-border'
                }`}
              />
              <span
                className={`max-w-[4.25rem] text-center text-[10px] font-medium uppercase leading-tight tracking-wide transition-colors duration-500 sm:max-w-none sm:text-xs ${
                  isActive
                    ? 'text-foreground'
                    : isPast
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/70'
                }`}
              >
                {displayLabels[step]}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-[11px]" role="list">
      {PAUSE_DEEP_DISPLAY_STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div
            key={step}
            role="listitem"
            className="flex min-w-0 flex-1 flex-col items-center gap-2.5"
            aria-current={isActive ? 'step' : undefined}
          >
            <div
              className={cn(
                'h-[3px] w-full rounded-[8px] transition-colors duration-300',
                isActive ? 'bg-foreground' : isPast ? 'bg-foreground/55' : 'bg-muted-foreground/40',
              )}
            />
            <span
              className={cn(
                'w-full truncate text-center text-xs font-medium leading-4 tracking-[0.05em]',
                isActive ? 'text-foreground' : isPast ? 'text-foreground/85' : 'text-muted-foreground',
              )}
            >
              {displayLabels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };
