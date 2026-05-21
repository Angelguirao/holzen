import {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import { runShiftEmotionFrameHubDone } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
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
