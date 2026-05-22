import { describe, expect, it } from 'vitest';

import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-frame-ui-flow';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS as breathingRoomMsFromFrameUiIo,
  companionPrefsForFullViewSlot as companionPrefsFromFrameUiIo,
  getCompanionSectionVisibility as getVisibilityFromFrameUiIo,
  isCompanionFullViewSlotSettled as isSettledFromFrameUiIo,
  isCompanionSectionVisible as isVisibleFromFrameUiIo,
  pauseSeverityToOrchestrateNumber as severityToOrchestrateFromFrameUiIo,
} from '@/features/pause/presentation/companion/pause-companion-frame-ui-io';

describe('pause-companion-frame-ui-io parity', () => {
  it('presentation I/O frame UI exports match frame-ui-flow CI umbrella', () => {
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBe(breathingRoomMsFromFrameUiIo);
    expect(companionPrefsForFullViewSlot).toBe(companionPrefsFromFrameUiIo);
    expect(isCompanionFullViewSlotSettled).toBe(isSettledFromFrameUiIo);
    expect(pauseSeverityToOrchestrateNumber).toBe(severityToOrchestrateFromFrameUiIo);
    expect(getCompanionSectionVisibility).toBe(getVisibilityFromFrameUiIo);
    expect(isCompanionSectionVisible).toBe(isVisibleFromFrameUiIo);
  });
});
