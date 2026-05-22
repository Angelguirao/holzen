/**
 * CI cluster anchor for companion frame UI presentation I/O (§3 / check:architecture-alignment).
 * Composes ritual/frame leaf modules (not full-view / section-visibility subcluster flow anchors).
 * Presentation: `pause-companion-frame-ui-io.ts` imports leaf modules directly;
 * `pause-companion-frame-ui-io.re-exports.test.ts` + `pause-companion-frame-ui-io-parity.test.ts` pin parity.
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
