import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { PauseScienceStepKey } from './pause-science-steps';

export function stepHighlightsScienceRow(
  currentStep: PauseStep | undefined,
  rowKey: PauseScienceStepKey,
): boolean {
  return currentStep === rowKey;
}
