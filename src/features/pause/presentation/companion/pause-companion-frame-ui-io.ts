/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Imports ritual/frame leaf modules directly (parity with orchestration/orchestrate I/O peels).
 */
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from '@/features/pause/application/use-cases/ritual/frame/full-view-page-helpers';
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from '@/features/pause/application/use-cases/ritual/frame/section-visibility';
