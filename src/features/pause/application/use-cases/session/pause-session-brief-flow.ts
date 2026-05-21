/**
 * CI cluster anchor for session brief hydration + depth-upgrade RPC (§3 / check:architecture-alignment).
 * Use cases live in sibling modules; re-export for presentation I/O imports.
 */
export {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './restored-brief-ritual-state';
export { initialRitualEntry } from './initial-ritual-entry';
export { logPauseRitualDepthUpgraded } from '../ritual/brief/ritual-depth-upgrade';
