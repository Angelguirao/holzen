/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Imports ritual/frame helpers via frame UI subcluster flow anchors
 * (parity with orchestration/orchestrate presentation I/O peels).
 */
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-full-view-ui-flow';
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow';
