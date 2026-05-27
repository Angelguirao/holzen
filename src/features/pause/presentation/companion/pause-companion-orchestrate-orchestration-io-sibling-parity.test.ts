import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: vi.fn().mockResolvedValue([]),
  invalidateCompanionUiCompletionQuery: vi.fn(),
}));

import {
  applyCompanionOrchestrateRetryReset,
  applyCompanionSlotOrchestrateOutcome,
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotError,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from './pause-companion-orchestrate-io';
import * as orchestrateIo from './pause-companion-orchestrate-io';
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
 * Presentation sibling parity: orchestrate-io vs orchestration-io (parity with application
 * `pause-companion-orchestrate-orchestration-flow-sibling-parity.test.ts` and
 * `application/.../pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`;
 * complements colocated `pause-companion-orchestrate-io-parity.test.ts`).
 */
describe('pause-companion-orchestrate-io ↔ pause-companion-orchestration-io sibling parity', () => {
  it('orchestrate-io and orchestration-io are distinct presentation I/O surfaces', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({ grounding: null, signal: null });

    expect(typeof pauseLoadCompanionOrchestrateSession).toBe('function');
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof pauseToggleCompanionLibraryFavorite).toBe('function');
    expect(typeof pauseCompanionUiStepCompletion).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');
    expect(typeof companionOrchestrator).toBe('object');
    expect(typeof companionPauseRepository).toBe('object');

    expect('pauseLoadCompanionOrchestrateSession' in orchestrateIo).toBe(false);
    expect('pauseToggleCompanionLibraryFavorite' in orchestrateIo).toBe(false);
    expect('nextExpandedWithLazyFetch' in orchestrateIo).toBe(false);

    expect('runCompanionSlotOrchestrate' in orchestrationIo).toBe(false);
    expect('applyCompanionSlotOrchestrateOutcome' in orchestrationIo).toBe(false);
    expect('EMPTY_COMPANION_SLOT_RELAXATIONS' in orchestrationIo).toBe(false);
  });

  it('orchestrate-io exports stay off session load, favorites, and expansion helpers', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(nextExpandedWithLazyFetch);
    expect(trackCompanionGenerationInitiated).not.toBe(pauseCompanionUiStepCompletion);
    expect(setCompanionSlotLoading).not.toBe(invalidateCompanionUiCompletionQuery);
  });

  it('orchestration-io exports stay off slot orchestrate, intervention bootstrap, and retry UI', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(runCompanionSlotOrchestrate);
    expect(loadCompanionOrchestrateSession).not.toBe(runCompanionSlotOrchestrate);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(nextExpandedWithLazyFetch).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(pauseCompanionUiStepCompletion).not.toBe(trackCompanionGenerationInitiated);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(setCompanionSlotError);
    expect('companionOrchestrator' in orchestrateIo).toBe(true);
    expect(orchestrateIo.companionOrchestrator).toBe(companionOrchestrator);
  });
});
