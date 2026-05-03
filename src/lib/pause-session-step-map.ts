import type { BriefFeelTile } from '@/components/pause/PauseBriefFeel';
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

/**
 * Initial brief sub-step when hydrating `/pause` from local storage.
 * When `ritualDepth` is not `brief`, callers still mount at `'feel'` until the user picks depth.
 *
 * Note: `computePauseStorageRitualSyncPatch` may leave `briefStep` undefined for a brief row
 * missing `briefStep` so React state is not clobbered — that is intentionally different.
 */
export function initialBriefPauseStepFromRestored(restored: PersistedSession | null): BriefPauseStep {
  if (restored?.ritualDepth === 'brief' && restored.briefStep) return restored.briefStep;
  return 'feel';
}

/** Hydrate brief “integrate” completion from local storage (defaults false). */
export function initialBriefIntegrateDoneFromRestored(restored: PersistedSession | null): boolean {
  return restored?.briefIntegrateDone ?? false;
}

/** Hydrate brief Feel tile from local storage (`PersistedSession.briefFace`). */
export function initialSelectedBriefFaceFromRestored(restored: PersistedSession | null): BriefFeelTile | null {
  return restored?.briefFace ?? null;
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
