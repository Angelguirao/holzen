/**
 * CI cluster anchor for restored breath ritual hydration (§3 / check:architecture-alignment).
 * Pure helpers live in domain; re-export for application-layer imports.
 */
export {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from '@/features/pause/domain/ritual/breathe/restored-breath-ritual-state';
