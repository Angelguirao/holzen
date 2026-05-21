/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Imports through `pause-companion-frame-ui-flow` instead of deep `ritual/frame/*` modules.
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
