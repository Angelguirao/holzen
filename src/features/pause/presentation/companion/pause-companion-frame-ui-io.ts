/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Presentation hooks import here instead of deep `application/use-cases/ritual/frame/*`.
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
