import { useTranslation } from 'react-i18next';
import { BRIEF_PAUSE_ORDER } from '@/features/pause/application/brief-ritual/brief-pause-order';
import { cn } from '@/lib/utils';
import { type BriefPauseStep } from '@/features/pause/domain/ritual-types';

interface Props {
  currentStep: BriefPauseStep;
}

/** Brief ritual header stepper: visual progress only (no step jumping). */
export function PauseBriefProgress({ currentStep }: Props) {
  const { t } = useTranslation();
  const labels: Record<BriefPauseStep, string> = {
    feel: t('pause.brief.steps.feel', { defaultValue: 'Feel' }),
    breath: t('pause.brief.steps.breath', { defaultValue: 'Breathe' }),
    integrate: t('pause.brief.steps.integrate', { defaultValue: 'Integrate' }),
    decide: t('pause.brief.steps.decide', { defaultValue: 'Decide' }),
  };

  const currentIndex = BRIEF_PAUSE_ORDER.indexOf(currentStep);

  return (
    <div
      className="flex w-full items-start justify-between gap-1 sm:gap-2"
      role="list"
      aria-label={t('pause.brief.stepsAria', { defaultValue: 'Brief pause steps' })}
    >
      {BRIEF_PAUSE_ORDER.map((step, i) => {
        const isActive = i === currentIndex;
        const isPast = i < currentIndex;
        return (
          <div
            key={step}
            role="listitem"
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
            aria-current={isActive ? 'step' : undefined}
          >
            <div
              className={cn(
                'h-[3px] w-full max-w-[2.5rem] rounded-full transition-colors duration-300 sm:max-w-[3.25rem]',
                isActive ? 'bg-foreground' : isPast ? 'bg-foreground/55' : 'bg-muted-foreground/25',
              )}
            />
            <span
              className={cn(
                'w-full truncate text-center text-[9px] font-medium uppercase leading-tight tracking-wide sm:text-[10px]',
                isActive ? 'text-foreground' : isPast ? 'text-foreground/80' : 'text-muted-foreground/70',
              )}
            >
              {labels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
