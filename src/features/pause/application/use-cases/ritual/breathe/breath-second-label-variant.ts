/**
 * CI cluster anchor for ritual breathe second-label variant (§3 / check:architecture-alignment).
 * Pure helpers live in domain; re-export for application-layer imports.
 */
export {
  resolvePauseBreathSecondLabelVariant,
  viteWantsPauseBreathSecondLabelShift,
  type PauseBreathSecondLabelVariant,
} from '@/features/pause/domain/ritual/breathe/breath-second-label-variant';
