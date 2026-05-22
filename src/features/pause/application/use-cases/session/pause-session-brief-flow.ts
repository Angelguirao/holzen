/**
 * CI cluster anchor for session brief hydration + depth-upgrade RPC (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; `pause-session-brief-io` imports subcluster modules directly (off this umbrella).
 * `pause-session-ritual-restore-io` imports restored brief fields via sibling session modules (off restore-flow umbrella).
 * Parity pins: `pause-session-brief-io.re-exports.test.ts` and `pause-session-brief-io-parity.test.ts`.
 */
export {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './restored-brief-ritual-state';
export { initialRitualEntry } from './initial-ritual-entry';
export { logPauseRitualDepthUpgraded } from '../ritual/brief/ritual-depth-upgrade';
