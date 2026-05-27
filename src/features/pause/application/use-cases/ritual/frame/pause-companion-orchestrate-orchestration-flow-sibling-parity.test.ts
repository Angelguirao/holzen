import { describe, expect, it } from 'vitest';

import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-flow';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  persistCompanionUiStepCompletion,
  runToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-flow';
import * as orchestrateFlow from './pause-companion-orchestrate-flow';
import * as orchestrationFlow from './pause-companion-orchestration-flow';

describe('pause-companion-orchestrate-flow ↔ pause-companion-orchestration-flow sibling parity', () => {
  it('orchestrate-flow and orchestration-flow are distinct sibling CI anchors', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({
      grounding: null,
      signal: null,
    });

    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(typeof runToggleCompanionLibraryFavorite).toBe('function');

    expect('loadCompanionOrchestrateSession' in orchestrateFlow).toBe(false);
    expect('nextExpandedWithLazyFetch' in orchestrateFlow).toBe(false);
    expect('persistCompanionUiStepCompletion' in orchestrateFlow).toBe(false);
    expect('runToggleCompanionLibraryFavorite' in orchestrateFlow).toBe(false);
    expect('runCompanionSlotOrchestrate' in orchestrationFlow).toBe(false);
    expect('applyCompanionSlotOrchestrateOutcome' in orchestrationFlow).toBe(false);
    expect('applyCompanionOrchestrateRetryReset' in orchestrationFlow).toBe(false);
    expect('logCompanionSlotOrchestrateInvoke' in orchestrationFlow).toBe(false);
    expect('trackCompanionGenerationInitiated' in orchestrationFlow).toBe(false);
    expect('setCompanionSlotError' in orchestrationFlow).toBe(false);
    expect('setCompanionSlotLoading' in orchestrationFlow).toBe(false);
    expect('EMPTY_COMPANION_SLOT_RELAXATIONS' in orchestrationFlow).toBe(false);
  });

  it('orchestrate umbrella exports stay off orchestration session load, expansion, UI completion, and favorites', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(loadCompanionOrchestrateSession);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(persistCompanionUiStepCompletion);
    expect(applyCompanionOrchestrateRetryReset).not.toBe(runToggleCompanionLibraryFavorite);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(loadCompanionOrchestrateSession);
    expect(trackCompanionGenerationInitiated).not.toBe(persistCompanionUiStepCompletion);
    expect(setCompanionSlotError).not.toBe(nextExpandedWithLazyFetch);
    expect(setCompanionSlotLoading).not.toBe(runToggleCompanionLibraryFavorite);
  });

  it('orchestration umbrella exports stay off slot orchestrate, intervention, retry, outcome, telemetry, and UI state', () => {
    expect(loadCompanionOrchestrateSession).not.toBe(runCompanionSlotOrchestrate);
    expect(nextExpandedWithLazyFetch).not.toBe(runCompanionSlotOrchestrate);
    expect(persistCompanionUiStepCompletion).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(runToggleCompanionLibraryFavorite).not.toBe(applyCompanionOrchestrateRetryReset);
    expect(loadCompanionOrchestrateSession).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(persistCompanionUiStepCompletion).not.toBe(trackCompanionGenerationInitiated);
    expect(nextExpandedWithLazyFetch).not.toBe(setCompanionSlotError);
    expect(runToggleCompanionLibraryFavorite).not.toBe(setCompanionSlotLoading);
    expect(loadCompanionOrchestrateSession).not.toBe(runCompanionSlotOrchestrate);
  });
});
