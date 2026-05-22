/**
 * Reflect hub presentation I/O (shift-frame done RPC + presentation mapping).
 * Imports hub subcluster flow anchors directly (parity with
 * `pause-reflect-mood-io` → mood subcluster flows).
 */
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-log-flow';
import { runShiftEmotionFrameHubDone } from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-emotion-frame-hub-done-flow';
import {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-shift-frame-hub-presentation-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
};

/** Default `PauseRepository` for reflect hub presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

/** Default port + use case: frame hub shift_emotion_logged (deduped). */
export function pauseShiftEmotionFrameHubDone(
  input: { pauseInstanceId: string | null; lastShiftLogKey: string | null },
): ReturnType<typeof runShiftEmotionFrameHubDone> {
  return runShiftEmotionFrameHubDone(reflectPauseRepository, input);
}
