import { describe, expect, it } from 'vitest';

import * as frameUiFlow from './pause-companion-frame-ui-flow';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-frame-ui-flow';
import * as orchestrationFlow from './pause-companion-orchestration-flow';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  persistCompanionUiStepCompletion,
  runToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-flow';

/**
 * Application sibling parity: frame-ui-flow vs orchestration-flow (parity with
 * `pause-companion-orchestrate-orchestration-flow-sibling-parity.test.ts` and
 * presentation `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts`).
 */
describe('pause-companion-frame-ui-flow ↔ pause-companion-orchestration-flow sibling parity', () => {
  it('frame-ui-flow and orchestration-flow are distinct sibling CI anchors', () => {
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);

    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(typeof runToggleCompanionLibraryFavorite).toBe('function');

    expect('loadCompanionOrchestrateSession' in frameUiFlow).toBe(false);
    expect('nextExpandedWithLazyFetch' in frameUiFlow).toBe(false);
    expect('persistCompanionUiStepCompletion' in frameUiFlow).toBe(false);
    expect('runToggleCompanionLibraryFavorite' in frameUiFlow).toBe(false);

    expect('getCompanionSectionVisibility' in orchestrationFlow).toBe(false);
    expect('isCompanionSectionVisible' in orchestrationFlow).toBe(false);
    expect('companionPrefsForFullViewSlot' in orchestrationFlow).toBe(false);
    expect('COMPANION_FULL_VIEW_BREATHING_ROOM_MS' in orchestrationFlow).toBe(false);
  });

  it('frame-ui-flow exports stay off session load, favorites, and expansion helpers', () => {
    expect(getCompanionSectionVisibility).not.toBe(loadCompanionOrchestrateSession);
    expect(isCompanionSectionVisible).not.toBe(nextExpandedWithLazyFetch);
    expect(companionPrefsForFullViewSlot).not.toBe(persistCompanionUiStepCompletion);
    expect(isCompanionFullViewSlotSettled).not.toBe(runToggleCompanionLibraryFavorite);
    expect(pauseSeverityToOrchestrateNumber).not.toBe(loadCompanionOrchestrateSession);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(nextExpandedWithLazyFetch);
  });

  it('orchestration-flow exports stay off frame visibility and full-view helpers', () => {
    expect(loadCompanionOrchestrateSession).not.toBe(getCompanionSectionVisibility);
    expect(nextExpandedWithLazyFetch).not.toBe(isCompanionSectionVisible);
    expect(persistCompanionUiStepCompletion).not.toBe(companionPrefsForFullViewSlot);
    expect(runToggleCompanionLibraryFavorite).not.toBe(isCompanionFullViewSlotSettled);
    expect(loadCompanionOrchestrateSession).not.toBe(pauseSeverityToOrchestrateNumber);
    expect(nextExpandedWithLazyFetch).not.toBe(COMPANION_FULL_VIEW_BREATHING_ROOM_MS);
  });
});
