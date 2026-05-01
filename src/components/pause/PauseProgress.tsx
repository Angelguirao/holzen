import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const STEPS = ['breathe', 'feel', 'reflect', 'shift', 'decide'] as const;
export type PauseStep = (typeof STEPS)[number];

interface Props {
  currentStep: PauseStep;
  onStepClick?: (step: PauseStep) => void;
  /** `segment` = full-width macro bars (pause shell); `pill` = compact dash stepper. */
  variant?: 'segment' | 'pill';
}

export function PauseProgress({ currentStep, onStepClick, variant = 'segment' }: Props) {
  const { t } = useTranslation();
  const stepLabels: Record<PauseStep, string> = {
    feel: t('pause.steps.feel', { defaultValue: 'Feel' }),
    breathe: t('pause.steps.breathe', { defaultValue: 'Breathe' }),
    reflect: t('pause.steps.reflect', { defaultValue: 'Reflect' }),
    shift: t('pause.steps.shift', { defaultValue: 'Shift' }),
    decide: t('pause.steps.decide', { defaultValue: 'Decide' }),
  };

  const currentIndex = STEPS.indexOf(currentStep);

  if (variant === 'pill') {
    return (
      <div className="flex w-max min-w-full items-center justify-start gap-1 sm:gap-1.5">
        {STEPS.map((step, i) => {
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
                  isActive ? 'w-6 bg-primary' : isPast ? 'w-4 bg-primary/40' : 'w-3 bg-border'
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
                {stepLabels[step]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-1.5 sm:gap-2">
      {STEPS.map((step, i) => {
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
              'flex min-w-0 flex-1 flex-col items-center gap-2',
              canClick ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <div
              className={cn(
                'h-[3px] w-full max-w-[3.25rem] rounded-full transition-colors duration-300 sm:max-w-[3.75rem]',
                isActive ? 'bg-foreground' : isPast ? 'bg-foreground/55' : 'bg-muted-foreground/25',
              )}
            />
            <span
              className={cn(
                'w-full truncate text-center text-[10px] font-medium uppercase leading-tight tracking-wide sm:text-[11px]',
                isActive ? 'text-foreground' : isPast ? 'text-foreground/80' : 'text-muted-foreground/70',
                canClick && 'hover:text-foreground',
              )}
            >
              {stepLabels[step]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { STEPS };
