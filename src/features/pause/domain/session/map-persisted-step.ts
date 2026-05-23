import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import { STEPS } from '@/features/pause/domain/pause-ritual-steps';

/** Map persisted `step` string (including legacy keys) to the current `PauseStep` union. */
export function mapPersistedStep(s: string | undefined): PauseStep {
  if (!s || s === 'pause') return 'feel';
  if (s === 'ground') return 'reflect';
  if (s === 'shift') return 'frame';
  /** Removed client-only `choose` beat — resume on Decide. */
  if (s === 'choose') return 'decide';
  if (STEPS.includes(s as PauseStep)) return s as PauseStep;
  return 'feel';
}
