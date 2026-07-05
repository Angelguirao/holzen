import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import { PAUSE_STEP_SCIENCE_COPY } from '@/legacy/pause-step-science/copy';
import { PauseScienceStepRow } from '@/legacy/pause-step-science/components/pause-science-step-row';
import { PAUSE_SCIENCE_STEPS } from '@/legacy/pause-step-science/domain/pause-science-steps';
import { stepHighlightsScienceRow } from '@/legacy/pause-step-science/domain/pause-science-step-highlight';

interface PauseScienceScrollBodyProps {
  /** When set, the matching ritual step’s citations block is visually emphasized. */
  currentStep?: PauseStep;
}

/** Scrollable “science behind the pause” body for use inside a bottom sheet / drawer. */
export function PauseScienceScrollBody(props?: PauseScienceScrollBodyProps) {
  const { currentStep } = props ?? {};

  return (
    <div className="space-y-6 px-1 pb-6 pt-2">
      <p className="text-sm font-medium text-muted-foreground">{PAUSE_STEP_SCIENCE_COPY.title}</p>
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
