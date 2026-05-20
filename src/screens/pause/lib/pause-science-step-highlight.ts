import type { PauseStep } from '@/features/pause/public';
import type { PauseScienceStepKey } from '@/screens/pause/lib/pause-science-steps';

/** True when the science sheet should emphasize a ritual step’s citation block. */
export function stepHighlightsScienceRow(
  current: PauseStep | undefined,
  rowKey: PauseScienceStepKey,
): boolean {
  if (!current) return false;
  return current === rowKey;
}
