import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Full routing order (includes `choose` between second breath and Decide).
 * The header stepper renders `PAUSE_DEEP_DISPLAY_STEPS` — six user-facing beats;
 * `choose` is a short interstitial before Decide, not a separate labeled segment.
 */
const STEPS = ['feel', 'breathe', 'reflect', 'frame', 'breath2', 'choose', 'decide'] as const;
export type PauseStep = (typeof STEPS)[number];

/** Six segments in the deep-pause shell (Choose is folded into the last “Decide” beat). */
const PAUSE_DEEP_DISPLAY_STEPS = ['feel', 'breathe', 'reflect', 'frame', 'breath2', 'decide'] as const;

export const PAUSE_DEEP_DISPLAY_STEP_COUNT = PAUSE_DEEP_DISPLAY_STEPS.length;

/** 1-based “Step n of 6” for the meta line; `choose` and `decide` both count as step 6. */
export function pauseDeepMacroStepNumber(step: PauseStep): number {
  if (step === 'choose' || step === 'decide') return PAUSE_DEEP_DISPLAY_STEP_COUNT;
  return STEPS.indexOf(step) + 1;
}

function pauseDeepDisplayProgressIndex(step: PauseStep): number {
  if (step === 'choose' || step === 'decide') {
    return PAUSE_DEEP_DISPLAY_STEPS.indexOf('decide');
  }
  return PAUSE_DEEP_DISPLAY_STEPS.indexOf(step as (typeof PAUSE_DEEP_DISPLAY_STEPS)[number]);
}

interface Props {
  currentStep: PauseStep;
  onStepClick?: (step: PauseStep) => void;
  /** `segment` = full-width macro bars (pause shell); `pill` = compact dash stepper. */
  variant?: 'segment' | 'pill';
  /** Figma variant B: macro step 5 labeled “Shift” instead of repeating “Breathe”. */
  breathSecondLabelVariant?: 'breathe' | 'shift';
}

export function PauseProgress({
  currentStep,
  onStepClick,
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
      <div className="flex w-max min-w-full items-center justify-start gap-1 sm:gap-1.5">
        {PAUSE_DEEP_DISPLAY_STEPS.map((step, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;
          const canClick = isPast && onStepClick;
          return (
            <button
              key={step}
              onClick={() => canClick && onStepClick(step)}
              disabled={!canClick}
              type="button"
              className={`flex min-w-[2.75rem] flex-col items-center gap-1.5 px-0.5 sm:min-w-0 ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
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
                      ? `text-muted-foreground ${canClick ? 'hover:text-foreground' : ''}`
                      : 'text-muted-foreground/70'
                }`}
              >
                {displayLabels[step]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-[11px]">
      {PAUSE_DEEP_DISPLAY_STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const canClick = isPast && onStepClick;
        return (
          <button
            key={step}
            type="button"
            onClick={() => canClick && onStepClick(step)}
            disabled={!canClick}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-2.5',
              canClick ? 'cursor-pointer' : 'cursor-default',
            )}
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
                canClick && 'hover:text-foreground',
              )}
            >
              {displayLabels[step]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { STEPS };
