import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: vi.fn().mockResolvedValue([]),
}));

import * as analyticsIo from './pause-companion-analytics-io';
import {
  companionAnalyticsRepository,
  logCompanionFeedbackVote,
  logCompanionFeedbackVoteWithRepository,
  logCompanionFullviewOpened,
  logCompanionFullviewOpenedWithRepository,
} from './pause-companion-analytics-io';
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

/**
 * Presentation sibling parity: analytics-io vs orchestrate-io (parity with
 * `pause-companion-analytics-orchestration-io-sibling-parity.test.ts` and
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`).
 */
describe('pause-companion-analytics-io ↔ pause-companion-orchestrate-io sibling parity', () => {
  it('analytics-io and orchestrate-io are distinct presentation I/O surfaces', () => {
    expect(typeof logCompanionFeedbackVote).toBe('function');
    expect(typeof logCompanionFullviewOpened).toBe('function');
    expect(typeof logCompanionFeedbackVoteWithRepository).toBe('function');
    expect(typeof logCompanionFullviewOpenedWithRepository).toBe('function');
    expect(typeof companionAnalyticsRepository).toBe('object');

    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
    expect(typeof setCompanionSlotLoading).toBe('function');
    expect(typeof setCompanionSlotError).toBe('function');
    expect(EMPTY_COMPANION_SLOT_RELAXATIONS).toMatchObject({ nudge: null, signal: null });

    expect('logCompanionFeedbackVote' in analyticsIo).toBe(true);
    expect('logCompanionFullviewOpened' in analyticsIo).toBe(true);
    expect('runCompanionSlotOrchestrate' in analyticsIo).toBe(false);
    expect('runCompanionSlotOrchestrate' in orchestrateIo).toBe(true);
    expect('logCompanionFeedbackVote' in orchestrateIo).toBe(false);
    expect('logCompanionFullviewOpened' in orchestrateIo).toBe(false);
  });

  it('analytics-io exports stay off slot orchestrate, intervention bootstrap, and retry UI', () => {
    expect(logCompanionFeedbackVote).not.toBe(runCompanionSlotOrchestrate);
    expect(logCompanionFullviewOpened).not.toBe(runCompanionSlotOrchestrate);
    expect(logCompanionFeedbackVoteWithRepository).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(logCompanionFullviewOpenedWithRepository).not.toBe(applyCompanionOrchestrateRetryReset);
    expect(logCompanionFeedbackVote).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(logCompanionFullviewOpened).not.toBe(trackCompanionGenerationInitiated);
    expect(logCompanionFeedbackVote).not.toBe(setCompanionSlotLoading);
    expect(logCompanionFullviewOpened).not.toBe(setCompanionSlotError);
    expect(logCompanionFeedbackVote).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(companionAnalyticsRepository).not.toBe(EMPTY_COMPANION_SLOT_RELAXATIONS);
  });

  it('orchestrate-io exports stay off analytics write helpers', () => {
    expect(runCompanionSlotOrchestrate).not.toBe(logCompanionFeedbackVote);
    expect(applyCompanionSlotOrchestrateOutcome).not.toBe(logCompanionFeedbackVoteWithRepository);
    expect(logCompanionSlotOrchestrateInvoke).not.toBe(logCompanionFullviewOpenedWithRepository);
    expect(trackCompanionGenerationInitiated).not.toBe(logCompanionFeedbackVote);
    expect(setCompanionSlotError).not.toBe(logCompanionFullviewOpened);
  });
});
