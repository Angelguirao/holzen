import { useTranslation } from 'react-i18next';
import { BRIEF_PAUSE_ORDER } from '@/lib/brief-pause-order';
import { cn } from '@/lib/utils';
import type { BriefPauseStep } from '@/lib/pause-session-storage';

interface Props {
  currentStep: BriefPauseStep;
  onStepClick?: (step: BriefPauseStep) => void;
}

export function PauseBriefProgress({ currentStep, onStepClick }: Props) {
  const { t } = useTranslation();
  const labels: Record<BriefPauseStep, string> = {
    feel: t('pause.brief.steps.feel', { defaultValue: 'Feel' }),
    breath: t('pause.brief.steps.breath', { defaultValue: 'Breath' }),
    integrate: t('pause.brief.steps.integrate', { defaultValue: 'Integrate' }),
    decide: t('pause.brief.steps.decide', { defaultValue: 'Decide' }),
  };

  const currentIndex = BRIEF_PAUSE_ORDER.indexOf(currentStep);

  return (
    <div className="flex w-full items-start justify-between gap-1 sm:gap-2">
      {BRIEF_PAUSE_ORDER.map((step, i) => {
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
                'h-[3px] w-full max-w-[2.5rem] rounded-full transition-colors duration-300 sm:max-w-[3.25rem]',
                isActive ? 'bg-foreground' : isPast ? 'bg-foreground/55' : 'bg-muted-foreground/25',
              )}
            />
            <span
              className={cn(
                'w-full truncate text-center text-[9px] font-medium uppercase leading-tight tracking-wide sm:text-[10px]',
                isActive ? 'text-foreground' : isPast ? 'text-foreground/80' : 'text-muted-foreground/70',
                canClick && 'hover:text-foreground',
              )}
            >
              {labels[step]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
