import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { RunShiftEmotionFrameHubDoneResult } from '@/features/pause/application/use-cases/ritual/feel/shift-emotion-log';

export const PAUSE_STEP_AFTER_FRAME_HUB_DONE = 'breath2' as const satisfies PauseStep;

export type ShiftFrameHubDonePresentation =
  | { kind: 'abort_sync_failed' }
  | { kind: 'advance'; logKey: string; nextStep: typeof PAUSE_STEP_AFTER_FRAME_HUB_DONE };

/** Maps `runShiftEmotionFrameHubDone` result to UI advance or sync-failed abort. */
export function resolveShiftFrameHubDonePresentation(
  outcome: RunShiftEmotionFrameHubDoneResult,
): ShiftFrameHubDonePresentation {
  if (outcome.status === 'sync_failed') {
    return { kind: 'abort_sync_failed' };
  }
  return {
    kind: 'advance',
    logKey: outcome.logKey,
    nextStep: PAUSE_STEP_AFTER_FRAME_HUB_DONE,
  };
}
