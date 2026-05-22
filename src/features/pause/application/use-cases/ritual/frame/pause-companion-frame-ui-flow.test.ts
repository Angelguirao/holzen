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
});
