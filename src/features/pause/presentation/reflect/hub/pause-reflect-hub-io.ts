/**
 * Reflect hub presentation I/O (shift-frame done RPC + presentation mapping).
 * Presentation imports through `pause-reflect-hub-flow` instead of split
 * `run-shift-emotion-frame-hub-done` and `domain/reflect/hub/*` paths.
 */
import {
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
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
