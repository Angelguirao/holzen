/**
 * CI cluster anchor for session breath segment RPC (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation breath I/O imports.
 */
export {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type BreathSegmentLogDeps,
} from './run-breath-segment-log';
