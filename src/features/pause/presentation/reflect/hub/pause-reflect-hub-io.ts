/**
 * Reflect hub presentation I/O (shift-frame done RPC + presentation mapping).
 * Imports domain hub helpers and `run-shift-emotion-frame-hub-done` directly (parity with
 * `pause-reflect-share-io` → domain + leaf use case).
 * Wrapper delegation pins: pause-reflect-hub-io-parity.test.ts (default + *WithRepository seam).
 * Sibling parity: `pause-reflect-generation-hub-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`,
 * `pause-reflect-hub-share-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`.
 */
import { runShiftEmotionFrameHubDone } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
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

/** Test seam: inject a custom `PauseRepository`. */
export function pauseShiftEmotionFrameHubDoneWithRepository(
  repository: PauseRepository,
  input: { pauseInstanceId: string | null; lastShiftLogKey: string | null },
): ReturnType<typeof runShiftEmotionFrameHubDone> {
  return runShiftEmotionFrameHubDone(repository, input);
}
