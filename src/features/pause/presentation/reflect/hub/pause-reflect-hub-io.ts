/**
 * Reflect hub presentation I/O (shift-frame done RPC + presentation mapping).
 * Imports domain mapping and run-* use case via `pause-reflect-hub-flow` CI anchor
 * (parity with `pause-reflect-steps-io` → steps flow).
 */
import {
  buildShiftEmotionFrameHubLogBundle,
  runShiftEmotionFrameHubDone,
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
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
