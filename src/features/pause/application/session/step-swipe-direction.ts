import { STEPS, type PauseStep } from '@/features/pause/public';

/**
 * Swipe transition direction for deep ritual navigation by `STEPS` index order.
 * Matches `goToStep` in `PauseSession` (`nextIndex >= currentIndex` → forward).
 */
export function pauseStepSwipeDirection(from: PauseStep, to: PauseStep): 'forward' | 'back' {
  const fromIdx = STEPS.indexOf(from);
  const toIdx = STEPS.indexOf(to);
  return toIdx >= fromIdx ? 'forward' : 'back';
}
