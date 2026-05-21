/**
 * CI cluster anchor for ritual reflect hub (§3 / check:architecture-alignment).
 * Pure shift-frame hub outcome mapping lives in domain; RPC use case in `run-shift-emotion-frame-hub-done`.
 * Re-export for presentation I/O imports.
 */
export {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
export {
  runShiftEmotionFrameHubDone,
  type RunShiftEmotionFrameHubDoneResult,
} from './run-shift-emotion-frame-hub-done';
