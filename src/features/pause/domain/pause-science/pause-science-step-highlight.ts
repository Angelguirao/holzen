import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { PauseScienceStepKey } from './pause-science-steps';

/** True when the science sheet should emphasize a ritual step’s citation block. */
export function stepHighlightsScienceRow(
  current: PauseStep | undefined,
  rowKey: PauseScienceStepKey,
): boolean {
  if (!current) return false;
  return current === rowKey;
}
