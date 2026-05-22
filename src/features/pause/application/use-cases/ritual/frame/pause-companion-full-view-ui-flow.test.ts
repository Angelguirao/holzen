import { describe, expect, it } from 'vitest';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-full-view-ui-flow';

describe('pause-companion-full-view-ui-flow', () => {
  it('re-exports full-view page helpers from full-view-page-helpers', () => {
    expect(typeof COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe('number');
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');
  });
});
