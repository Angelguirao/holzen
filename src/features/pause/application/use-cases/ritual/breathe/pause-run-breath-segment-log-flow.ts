/**
 * CI cluster anchor for ritual breathe — breath segment RPC log (§3 / check:architecture-alignment).
 * Re-export parity: `pause-session-breath-flow.test.ts` may import this anchor.
 * Presentation: `pause-session-breath-io` imports `run-breath-segment-log` leaf directly.
 */
export {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type BreathSegmentLogDeps,
} from './run-breath-segment-log';
