import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';

/** Outcome of `runShiftEmotionFrameHubDone` — advance with dedupe key or sync failure. */
export type ShiftEmotionFrameHubDoneOutcome =
  | { status: 'advance'; logKey: string }
  | { status: 'sync_failed' };

export const PAUSE_STEP_AFTER_FRAME_HUB_DONE = 'breath2' as const satisfies PauseStep;

export type ShiftFrameHubDonePresentation =
  | { kind: 'abort_sync_failed' }
  | { kind: 'advance'; logKey: string; nextStep: typeof PAUSE_STEP_AFTER_FRAME_HUB_DONE };

/** Maps shift frame hub RPC outcome to UI advance or sync-failed abort. */
export function resolveShiftFrameHubDonePresentation(
  outcome: ShiftEmotionFrameHubDoneOutcome,
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
