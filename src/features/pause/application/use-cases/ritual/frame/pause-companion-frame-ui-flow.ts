/**
 * CI cluster anchor for companion frame UI presentation I/O (§3 / check:architecture-alignment).
 * Full-view helpers and section visibility live in sibling `ritual/frame/*` modules.
 */
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from './full-view-page-helpers';

export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
  type CompanionSectionVisibility,
} from './section-visibility';
