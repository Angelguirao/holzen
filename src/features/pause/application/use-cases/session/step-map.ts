import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { PauseStep } from '@/features/pause/public';
import { STEPS } from '@/features/pause/domain/pause-ritual-steps';
import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { PersistedSession } from '@/features/pause/domain/session-model';
import { hasPersistedPauseSessionPayload } from './persisted-session-guards';

/**
 * Pause route helpers: map persisted step strings and derive initial ritual UI from `PersistedSession`.
 *
 * **Persistence contract:** `docs/systems/pause-system.md` section 7.2 (hydration / local snapshot).
 * **Ritual sync caveat:** `computePauseStorageRitualSyncPatch` in `application/use-cases/session/storage-ritual-sync.ts`
 * may intentionally omit `briefStep` when syncing — see `initialBriefPauseStepFromRestored` note below.
 * **Code map:** same pause doc, section 10 (Related docs and code).
 */

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

/**
 * Initial depth-picker vs brief/deep from restored local session.
 * Call with `null` when there is no compatible restore payload.
 */
export function initialRitualEntry(restored: PersistedSession | null): RitualDepth | 'picker' {
  if (!hasPersistedPauseSessionPayload(restored)) return 'picker';
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

/** Hydrate Feel-step tile from local storage (`PersistedSession.briefFace`, brief ritual saves only). */
export function initialSelectedBriefFaceFromRestored(restored: PersistedSession | null): FeelStepTile | null {
  return restored?.briefFace ?? null;
}

/** Session vs Done screen when hydrating `/pause` from local storage. */
export function initialPhaseFromRestored(restored: PersistedSession | null): 'session' | 'done' {
  return restored?.phase ?? 'session';
}

/** Outcome label persisted when the user finished Decide (or null). */
export function initialDecisionFromRestored(restored: PersistedSession | null): string | null {
  return restored?.decision ?? null;
}

/**
 * First breath segment completion from local restore. Matches `normalizePauseRitualFields` in
 * `pause-session-storage.ts` (legacy v1 `breathingCompleted` rolls into `breathingFirstCompleted`).
 */
export function initialBreathingFirstCompletedFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.breathingFirstCompleted ?? restored.breathingCompleted ?? false;
}

/** Second breath segment completion from local restore (matches `normalizePauseRitualFields`). */
export function initialBreathingSecondCompletedFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.breathingSecondCompleted ?? false;
}

/** Frame hub completion from local restore (matches `normalizePauseRitualFields`). */
export function initialFrameDoneFromRestored(restored: PersistedSession | null): boolean {
  if (!restored) return false;
  return restored.frameDone ?? false;
}

/**
 * When resuming from local storage past the first or second breath beat, `usePauseBreathSegmentRpcLoggers`
 * must treat `breath_completed` segment RPCs as already satisfied (refs start `true`).
 * Uses the same `mapPersistedStep` + `STEPS` order as initial `step` state in `PauseSession.tsx`.
 */
export function initialBreathSegmentRpcLoggedFlagsFromRestored(restored: PersistedSession | null): {
  segment1Logged: boolean;
  segment2Logged: boolean;
} {
  if (!restored) return { segment1Logged: false, segment2Logged: false };
  const restoredStep = mapPersistedStep(restored.step);
  const idx = STEPS.indexOf(restoredStep);
  return {
    segment1Logged: idx > STEPS.indexOf('breathe'),
    segment2Logged: idx > STEPS.indexOf('breath2'),
  };
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
