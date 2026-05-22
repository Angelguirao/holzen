/**
 * Frame UI helpers for inline companion section + full-view routes.
 * Imports ritual/frame leaf modules directly (parity with orchestration/orchestrate I/O peels).
 * Sibling parity: `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts` ↔ `pause-companion-orchestrate-io`;
 * `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-orchestration-io`;
 * reciprocal inline pins: `pause-companion-frame-ui-io.test.ts` ↔ `pause-companion-orchestrate-io.test.ts`,
 * ↔ `pause-companion-orchestration-io.test.ts`.
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
