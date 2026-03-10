import { useTranslation } from 'react-i18next';

const STEPS = ['pause', 'reflect', 'ground', 'decide'] as const;
export type PauseStep = typeof STEPS[number];

interface Props {
  currentStep: PauseStep;
  onStepClick?: (step: PauseStep) => void;
}

export function PauseProgress({ currentStep, onStepClick }: Props) {
  const { t } = useTranslation();
  const stepLabels: Record<PauseStep, string> = {
    pause: t('pause.steps.pause', 'Pause'),
    reflect: t('pause.steps.reflect', 'Reflect'),
    ground: t('pause.steps.ground', 'Ground'),
    decide: t('pause.steps.decide', 'Decide'),
  };

  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        const canClick = isPast && onStepClick;
        return (
          <button
            key={step}
            onClick={() => canClick && onStepClick(step)}
            disabled={!canClick}
            className={`flex flex-col items-center gap-1 px-1 ${canClick ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                isActive ? 'w-6 bg-primary/60' : isPast ? 'w-4 bg-primary/25' : 'w-4 bg-border/30'
              }`}
            />
            <span
              className={`text-[8px] font-mono uppercase tracking-[0.15em] transition-colors duration-500 ${
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
