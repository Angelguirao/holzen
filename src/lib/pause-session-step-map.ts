import type { PauseStep } from '@/components/pause/PauseProgress';
import { STEPS } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/lib/pause-session-storage';

/** Map persisted `step` string (including legacy keys) to the current `PauseStep` union. */
export function mapPersistedStep(s: string | undefined): PauseStep {
  if (!s || s === 'pause') return 'feel';
  if (s === 'ground') return 'reflect';
  if (s === 'shift') return 'frame';
  if (STEPS.includes(s as PauseStep)) return s as PauseStep;
  return 'feel';
}

/**
 * Initial depth-picker vs brief/deep from restored local session.
 * Call with `null` when there is no compatible restore payload.
 */
export function initialRitualEntry(restored: PersistedSession | null): RitualDepth | 'picker' {
  if (!restored?.message) return 'picker';
  if (restored.ritualDepth === 'brief' || restored.ritualDepth === 'deep') return restored.ritualDepth;
  if (restored.moodDone || restored.phase === 'done' || restored.step !== 'feel') return 'deep';
  return 'picker';
}

/** Brief “Integrate” has no dedicated citations row — highlight Reflect (regulation) sources. */
export function briefStepToPauseScienceStep(brief: BriefPauseStep): PauseStep {
  switch (brief) {
    case 'feel':
      return 'feel';
    case 'breath':
      return 'breathe';
    case 'integrate':
      return 'reflect';
    case 'decide':
      return 'decide';
  }
}
