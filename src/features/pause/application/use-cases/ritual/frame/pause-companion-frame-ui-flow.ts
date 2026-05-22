/**
 * CI cluster anchor for companion frame UI presentation I/O (§3 / check:architecture-alignment).
 * Composes frame UI subcluster anchors; presentation imports via `pause-companion-frame-ui-io.ts`.
 */
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-full-view-ui-flow';
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from './pause-companion-section-visibility-flow';
