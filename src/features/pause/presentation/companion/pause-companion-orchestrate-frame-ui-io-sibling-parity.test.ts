import { describe, expect, it, vi } from 'vitest';

vi.mock('./pause-companion-orchestration-io', () => ({
  companionOrchestrator: { port: 'companionOrchestrator' },
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
import * as orchestrateIo from './pause-companion-orchestrate-io';
import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-io';

/**
 * Presentation sibling parity: orchestrate-io vs frame-ui-io (parity with application
 * `pause-companion-frame-ui-flow` vs orchestrate subclusters; complements
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`).
 */
describe('pause-companion-orchestrate-io ↔ pause-companion-frame-ui-io sibling parity', () => {
  it('orchestrate-io and frame-ui-io are distinct presentation I/O surfaces', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof runCompanionInterventionBootstrap).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof resetInterventionIdempotency).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({ nudge: null, signal: null });

    expect(typeof getCompanionSectionVisibility).toBe('function');
    expect(typeof isCompanionSectionVisible).toBe('function');
    expect(typeof companionPrefsForFullViewSlot).toBe('function');
    expect(typeof isCompanionFullViewSlotSettled).toBe('function');
    expect(typeof pauseSeverityToOrchestrateNumber).toBe('function');
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).toBeGreaterThan(0);

    expect('getCompanionSectionVisibility' in orchestrateIo).toBe(false);
    expect('isCompanionSectionVisible' in orchestrateIo).toBe(false);
    expect('pauseSeverityToOrchestrateNumber' in orchestrateIo).toBe(false);

    expect('runCompanionSlotOrchestrate' in frameUiIo).toBe(false);
    expect('runCompanionInterventionBootstrap' in frameUiIo).toBe(false);
    expect('EMPTY_COMPANION_SLOT_RELAXATIONS' in frameUiIo).toBe(false);
  });

  it('orchestrate-io exports stay off frame section visibility and full-view helpers', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(getCompanionSectionVisibility);
    expect(runCompanionInterventionBootstrap).not.toBe(isCompanionSectionVisible);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(companionPrefsForFullViewSlot);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(isCompanionFullViewSlotSettled);
    expect(trackCompanionGenerationInitiated).not.toBe(pauseSeverityToOrchestrateNumber);
    expect(setCompanionSlotLoading).not.toBe(COMPANION_FULL_VIEW_BREATHING_ROOM_MS);
    expect(resetInterventionIdempotency).not.toBe(getCompanionSectionVisibility);
  });

  it('frame-ui-io exports stay off slot orchestrate, intervention bootstrap, and retry UI', () => {
    expect(getCompanionSectionVisibility).not.toBe(runCompanionSlotOrchestrate);
    expect(isCompanionSectionVisible).not.toBe(runCompanionInterventionBootstrap);
    expect(companionPrefsForFullViewSlot).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(isCompanionFullViewSlotSettled).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(pauseSeverityToOrchestrateNumber).not.toBe(trackCompanionGenerationInitiated);
    expect(COMPANION_FULL_VIEW_BREATHING_ROOM_MS).not.toBe(setCompanionSlotError);
    expect(getCompanionSectionVisibility).not.toBe(EMPTY_COMPANION_SLOT_RELAXATIONS);
  });
});
