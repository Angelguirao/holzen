import type { BriefFeelTile } from '@/components/pause/PauseBriefFeel';
import type { PauseStep } from '@/components/pause/PauseProgress';
import { STEPS } from '@/components/pause/PauseProgress';
import type { BriefPauseStep, PersistedSession, RitualDepth } from '@/lib/pause-session-storage';

/**
 * Pause route helpers: map persisted step strings and derive initial ritual UI from `PersistedSession`.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Ritual sync caveat:** `computePauseStorageRitualSyncPatch` in `src/lib/pause-session-storage-ritual-sync.ts`
 * may intentionally omit `briefStep` when syncing — see `initialBriefPauseStepFromRestored` note below.
 * **Code map:** same pause doc, section 10 (Related docs and code).
 */

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

/** Session vs Done screen when hydrating `/pause` from local storage. */
export function initialPhaseFromRestored(restored: PersistedSession | null): 'session' | 'done' {
  return restored?.phase ?? 'session';
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
