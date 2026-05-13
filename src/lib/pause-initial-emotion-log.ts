import type { MoodValue } from '@/components/MoodCheck';
import type { FeelStepTile } from '@/components/pause/pause-feel-types';

export type InitialEmotionLogOpts = {
  briefRitual?: boolean;
  briefFace?: FeelStepTile;
};

/** Body for `pauseLogStep` with `stepType: 'initial_emotion_logged'` (shared ritual Feel step). */
export function buildInitialEmotionLoggedPayload(
  mood: MoodValue,
  intensity: number | undefined,
  opts?: InitialEmotionLogOpts,
): Record<string, unknown> {
  const payload: Record<string, unknown> =
    typeof intensity === 'number' ? { mood, intensity } : { mood };
  if (opts?.briefRitual) payload.brief_ritual = true;
  if (opts?.briefFace) payload.brief_face = opts.briefFace;
  return payload;
}

/**
 * Stable key for deduping Feel RPCs and matching `lastFeelLogKeyRef` in `PauseSession`.
 * Mirrors `JSON.stringify({ ...payload, _bf: opts?.briefFace })`.
 */
export function initialEmotionLogDedupeKey(
  payload: Record<string, unknown>,
  briefFace?: FeelStepTile | null,
): string {
  return JSON.stringify({ ...payload, _bf: briefFace });
}

/** Skip Feel: RPC payload + the same string stored on `lastFeelLogKeyRef` after success. */
export function initialEmotionSkippedLoggedPayload(): Record<string, unknown> {
  return { skipped: true };
}

export function initialEmotionSkippedLogDedupeKey(): string {
  return JSON.stringify({ skipped: true });
}
