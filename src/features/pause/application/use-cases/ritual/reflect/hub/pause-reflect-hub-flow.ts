/**
 * CI cluster anchor for ritual reflect hub presentation I/O (§3 / check:architecture-alignment).
 * Pure shift-frame presentation mapping lives in domain; RPC use case in `run-shift-emotion-frame-hub-done`.
 * Presentation: `pause-reflect-hub-io.ts` imports through this anchor.
 */
export {
  resolveShiftFrameHubDonePresentation,
  type ShiftFrameHubDonePresentation,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
export { runShiftEmotionFrameHubDone } from './run-shift-emotion-frame-hub-done';
