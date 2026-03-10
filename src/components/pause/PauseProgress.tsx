import { useTranslation } from 'react-i18next';

const STEPS = ['pause', 'reflect', 'ground', 'decide'] as const;
export type PauseStep = typeof STEPS[number];

export function PauseProgress({ currentStep }: { currentStep: PauseStep }) {
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
        return (
          <div key={step} className="flex flex-col items-center gap-1">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                isActive ? 'w-6 bg-primary/60' : isPast ? 'w-4 bg-primary/25' : 'w-4 bg-border/30'
              }`}
            />
            <span
              className={`text-[8px] font-mono uppercase tracking-[0.15em] transition-colors duration-500 ${
                isActive ? 'text-primary/60' : isPast ? 'text-muted-foreground/30' : 'text-muted-foreground/15'
              }`}
            >
              {stepLabels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };
