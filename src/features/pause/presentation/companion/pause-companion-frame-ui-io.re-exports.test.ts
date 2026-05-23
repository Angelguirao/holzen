import { describe, expect, it } from 'vitest';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS as breathingRoomMsDirect,
  companionPrefsForFullViewSlot as companionPrefsDirect,
  isCompanionFullViewSlotSettled as isSettledDirect,
  pauseSeverityToOrchestrateNumber as severityToOrchestrateDirect,
} from '@/features/pause/application/use-cases/ritual/frame/full-view-page-helpers';
import {
  getCompanionSectionVisibility as getVisibilityDirect,
  isCompanionSectionVisible as isVisibleDirect,
} from '@/features/pause/application/use-cases/ritual/frame/section-visibility';
import {
  getCompanionSectionVisibility as getVisibilityFromSectionFlow,
  isCompanionSectionVisible as isVisibleFromSectionFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-visibility-flow';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-frame-ui-io';

describe('pause-companion-frame-ui-io re-exports', () => {
  it('re-exports frame UI helpers from ritual/frame leaf modules', () => {
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');

    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe(breathingRoomMsDirect);
    expect(companionPrefsForFullViewSlot).toBe(companionPrefsDirect);
    expect(isCompanionFullViewSlotSettled).toBe(isSettledDirect);
    expect(pauseSeverityToOrchestrateNumber).toBe(severityToOrchestrateDirect);
    expect(getCompanionSectionVisibility).toBe(getVisibilityDirect);
    expect(isCompanionSectionVisible).toBe(isVisibleDirect);
  });

  it('presentation I/O section visibility bindings match pause-companion-section-visibility-flow CI anchor (leaf parity)', () => {
    expect(getCompanionSectionVisibility).toBe(getVisibilityFromSectionFlow);
    expect(isCompanionSectionVisible).toBe(isVisibleFromSectionFlow);
  });
});
