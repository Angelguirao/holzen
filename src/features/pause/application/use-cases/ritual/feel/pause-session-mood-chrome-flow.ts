/**
 * CI cluster anchor for ritual reflect mood chrome flows (§3 / check:architecture-alignment).
 * Pure chrome close + deep-picker gate helpers live in domain; re-export for application-layer imports.
 */
export {
  resolvePauseSessionChromeCloseAction,
  runDeepPausePickerEntryIfPro,
  runPauseSessionChromeCloseAction,
} from '@/features/pause/domain/feel/pause-session-mood-chrome-flow';
export type {
  PauseSessionChromeCloseAction,
  PauseSessionPhase,
} from '@/features/pause/domain/feel/pause-session-mood-chrome-flow';
