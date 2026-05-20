import { useTranslation } from 'react-i18next';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { PauseScienceStepRow } from '@/screens/pause/components/pause-science-step-row';
import { stepHighlightsScienceRow } from '@/screens/pause/lib/pause-science-step-highlight';
import { PAUSE_SCIENCE_STEPS } from '@/screens/pause/lib/pause-science-steps';

interface PauseScienceScrollBodyProps {
  /** When set, the matching ritual step’s citations block is visually emphasized. */
  currentStep?: PauseStep;
}

/** Scrollable “science behind the pause” body for use inside a bottom sheet / drawer. */
export function PauseScienceScrollBody(props?: PauseScienceScrollBodyProps) {
  const { currentStep } = props ?? {};
  const { t } = useTranslation();

  return (
    <div className="space-y-6 px-1 pb-6 pt-2">
      <p className="text-sm font-medium text-muted-foreground">{t('pauseScience.title')}</p>
      <div className="space-y-5">
        {PAUSE_SCIENCE_STEPS.map((step) => (
          <PauseScienceStepRow
            key={step.key}
            step={step}
            highlighted={stepHighlightsScienceRow(currentStep, step.key)}
          />
        ))}
      </div>
    </div>
  );
}
