import { describe, expect, it } from 'vitest';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS as breathingRoomMsDirect,
  companionPrefsForFullViewSlot as prefsForSlotDirect,
  isCompanionFullViewSlotSettled as isSlotSettledDirect,
  pauseSeverityToOrchestrateNumber as severityToNumberDirect,
} from './full-view-page-helpers';
import {
  getCompanionSectionVisibility as getVisibilityDirect,
  isCompanionSectionVisible as isVisibleDirect,
} from './section-visibility';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS as breathingRoomMsFromFullViewFlow,
  companionPrefsForFullViewSlot as prefsForSlotFromFullViewFlow,
  isCompanionFullViewSlotSettled as isSlotSettledFromFullViewFlow,
  pauseSeverityToOrchestrateNumber as severityToNumberFromFullViewFlow,
} from './pause-companion-full-view-ui-flow';
import {
  getCompanionSectionVisibility as getVisibilityFromSectionFlow,
  isCompanionSectionVisible as isVisibleFromSectionFlow,
} from './pause-companion-section-visibility-flow';
import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationFlow,
  nextExpandedWithLazyFetch as nextExpandedFromOrchestrationFlow,
  persistCompanionUiStepCompletion as persistFromOrchestrationFlow,
  runToggleCompanionLibraryFavorite as toggleFavoriteFromOrchestrationFlow,
} from './pause-companion-orchestration-flow';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-frame-ui-flow';

describe('pause-companion-frame-ui-flow', () => {
  it('re-exports frame UI helpers from ritual/frame leaf modules', () => {
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');

    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe(breathingRoomMsDirect);
    expect(getCompanionSectionVisibility).toBe(getVisibilityDirect);
    expect(isCompanionSectionVisible).toBe(isVisibleDirect);
    expect(companionPrefsForFullViewSlot).toBe(prefsForSlotDirect);
    expect(isCompanionFullViewSlotSettled).toBe(isSlotSettledDirect);
    expect(pauseSeverityToOrchestrateNumber).toBe(severityToNumberDirect);
  });

  it('umbrella bindings match frame UI subcluster CI anchors (leaf parity)', () => {
    expect(getCompanionSectionVisibility).toBe(getVisibilityFromSectionFlow);
    expect(isCompanionSectionVisible).toBe(isVisibleFromSectionFlow);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe(breathingRoomMsFromFullViewFlow);
    expect(companionPrefsForFullViewSlot).toBe(prefsForSlotFromFullViewFlow);
    expect(isCompanionFullViewSlotSettled).toBe(isSlotSettledFromFullViewFlow);
    expect(pauseSeverityToOrchestrateNumber).toBe(severityToNumberFromFullViewFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-companion-orchestration-flow.test.ts` (frame UI vs session orchestration).
   * Dedicated sibling file: `pause-companion-frame-ui-orchestration-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: orchestration-flow exports stay distinct from frame-ui-flow', () => {
    expect(getCompanionSectionVisibility).not.toBe(loadSessionFromOrchestrationFlow);
    expect(isCompanionSectionVisible).not.toBe(nextExpandedFromOrchestrationFlow);
    expect(companionPrefsForFullViewSlot).not.toBe(persistFromOrchestrationFlow);
    expect(isCompanionFullViewSlotSettled).not.toBe(toggleFavoriteFromOrchestrationFlow);
    expect(pauseSeverityToOrchestrateNumber).not.toBe(loadSessionFromOrchestrationFlow);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(nextExpandedFromOrchestrationFlow);
    // Reciprocal inline pins: `pause-companion-orchestration-flow.test.ts`.
  });
});
