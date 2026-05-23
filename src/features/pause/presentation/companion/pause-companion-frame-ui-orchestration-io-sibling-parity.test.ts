import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: vi.fn().mockResolvedValue([]),
}));

import * as frameUiIo from './pause-companion-frame-ui-io';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  getCompanionSectionVisibility,
  isCompanionFullViewSlotSettled,
  isCompanionSectionVisible,
  pauseSeverityToOrchestrateNumber,
} from './pause-companion-frame-ui-io';
import * as orchestrationIo from './pause-companion-orchestration-io';
import {
  companionOrchestrator,
  companionPauseRepository,
  invalidateCompanionUiCompletionQuery,
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  pauseCompanionUiStepCompletion,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-io';

/**
 * Presentation sibling parity: frame-ui-io vs orchestration-io (parity with
 * `pause-companion-orchestrate-frame-ui-io-sibling-parity.test.ts` and
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`).
 */
describe('pause-companion-frame-ui-io ↔ pause-companion-orchestration-io sibling parity', () => {
  it('frame-ui-io and orchestration-io are distinct presentation I/O surfaces', () => {
    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);

    expect(typeof pauseLoadCompanionOrchestrateSession).toBe('function');
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof pauseToggleCompanionLibraryFavorite).toBe('function');
    expect(typeof pauseCompanionUiStepCompletion).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');
    expect(typeof companionOrchestrator).toBe('object');
    expect(typeof companionPauseRepository).toBe('object');

    expect('pauseLoadCompanionOrchestrateSession' in frameUiIo).toBe(false);
    expect('pauseToggleCompanionLibraryFavorite' in frameUiIo).toBe(false);
    expect('nextExpandedWithLazyFetch' in frameUiIo).toBe(false);

    expect('getCompanionSectionVisibility' in orchestrationIo).toBe(false);
    expect('isCompanionSectionVisible' in orchestrationIo).toBe(false);
    expect('pauseSeverityToOrchestrateNumber' in orchestrationIo).toBe(false);
    expect('COMPANION_FULL_VIEW_BREATHING_ROOM_MS' in orchestrationIo).toBe(false);
  });

  it('frame-ui-io exports stay off session load, favorites, and expansion helpers', () => {
    expect(getCompanionSectionVisibility).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(isCompanionSectionVisible).not.toBe(loadCompanionOrchestrateSession);
    expect(companionPrefsForFullViewSlot).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(isCompanionFullViewSlotSettled).not.toBe(nextExpandedWithLazyFetch);
    expect(pauseSeverityToOrchestrateNumber).not.toBe(pauseCompanionUiStepCompletion);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(invalidateCompanionUiCompletionQuery);
    expect(getCompanionSectionVisibility).not.toBe(companionOrchestrator);
  });

  it('orchestration-io exports stay off frame section visibility and full-view helpers', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(getCompanionSectionVisibility);
    expect(loadCompanionOrchestrateSession).not.toBe(isCompanionSectionVisible);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(companionPrefsForFullViewSlot);
    expect(nextExpandedWithLazyFetch).not.toBe(isCompanionFullViewSlotSettled);
    expect(pauseCompanionUiStepCompletion).not.toBe(pauseSeverityToOrchestrateNumber);
    expect(invalidateCompanionUiCompletionQuery).not.toBe(COMPANION_FULL_VIEW_BREATHING_ROOM_MS);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(getCompanionSectionVisibility);
  });
});
