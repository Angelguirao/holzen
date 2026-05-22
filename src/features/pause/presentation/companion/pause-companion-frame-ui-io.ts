/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Imports ritual/frame helpers via `pause-companion-frame-ui-flow` CI anchor
 * (parity with orchestration/orchestrate presentation I/O peels).
 */
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
  type CompanionSectionVisibility,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-frame-ui-flow';
