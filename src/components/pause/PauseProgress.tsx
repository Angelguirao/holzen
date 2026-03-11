import { useTranslation } from 'react-i18next';

const STEPS = ['feel', 'breathe', 'reflect', 'shift', 'decide'] as const;
export type PauseStep = typeof STEPS[number];

interface Props {
  currentStep: PauseStep;
  onStepClick?: (step: PauseStep) => void;
}

export function PauseProgress({ currentStep, onStepClick }: Props) {
  const { t } = useTranslation();
  const stepLabels: Record<PauseStep, string> = {
    feel: t('pause.steps.feel', 'Feel'),
    breathe: t('pause.steps.breathe', 'Breathe'),
    reflect: t('pause.steps.reflect', 'Reflect'),
    shift: t('pause.steps.shift', 'Shift'),
    decide: t('pause.steps.decide', 'Decide'),
  };

  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1.5">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const canClick = isPast && onStepClick;
        return (
          <button
            key={step}
            onClick={() => canClick && onStepClick(step)}
            disabled={!canClick}
            className={`flex flex-col items-center gap-1 px-0.5 ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                isActive ? 'w-5 bg-primary/60' : isPast ? 'w-3 bg-primary/25' : 'w-3 bg-border/30'
              }`}
            />
            <span
              className={`text-[7px] font-mono uppercase tracking-[0.12em] transition-colors duration-500 ${
                isActive ? 'text-primary/60' : isPast ? 'text-muted-foreground/30 hover:text-muted-foreground/50' : 'text-muted-foreground/15'
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

export { STEPS };
