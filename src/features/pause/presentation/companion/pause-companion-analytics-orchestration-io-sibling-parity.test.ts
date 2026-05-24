import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: vi.fn().mockResolvedValue([]),
  invalidateCompanionUiCompletionQuery: vi.fn(),
}));

import * as analyticsIo from './pause-companion-analytics-io';
import {
  companionAnalyticsRepository,
  logCompanionFeedbackVote,
  logCompanionFeedbackVoteWithRepository,
  logCompanionFullviewOpened,
  logCompanionFullviewOpenedWithRepository,
} from './pause-companion-analytics-io';
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
 * Presentation sibling parity: analytics-io vs orchestration-io (parity with
 * `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts`,
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`, and application
 * `application/.../pause-companion-analytics-orchestration-io-sibling-parity.test.ts`).
 */
describe('pause-companion-analytics-io ↔ pause-companion-orchestration-io sibling parity', () => {
  it('analytics-io and orchestration-io are distinct presentation I/O surfaces', () => {
    expect(typeof logCompanionFeedbackVote).toBe('function');
    expect(typeof logCompanionFullviewOpened).toBe('function');
    expect(typeof logCompanionFeedbackVoteWithRepository).toBe('function');
    expect(typeof logCompanionFullviewOpenedWithRepository).toBe('function');
    expect(typeof companionAnalyticsRepository).toBe('object');

    expect(typeof pauseLoadCompanionOrchestrateSession).toBe('function');
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof pauseToggleCompanionLibraryFavorite).toBe('function');
    expect(typeof pauseCompanionUiStepCompletion).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');
    expect(typeof companionOrchestrator).toBe('object');
    expect(typeof companionPauseRepository).toBe('object');

    expect('logCompanionFeedbackVote' in analyticsIo).toBe(true);
    expect('logCompanionFullviewOpened' in analyticsIo).toBe(true);
    expect('pauseLoadCompanionOrchestrateSession' in analyticsIo).toBe(false);
    expect('nextExpandedWithLazyFetch' in analyticsIo).toBe(false);

    expect('pauseLoadCompanionOrchestrateSession' in orchestrationIo).toBe(true);
    expect('pauseToggleCompanionLibraryFavorite' in orchestrationIo).toBe(true);
    expect('logCompanionFeedbackVote' in orchestrationIo).toBe(false);
    expect('logCompanionFullviewOpened' in orchestrationIo).toBe(false);
  });

  it('analytics-io exports stay off session load, favorites, and expansion helpers', () => {
    expect(logCompanionFeedbackVote).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(logCompanionFullviewOpened).not.toBe(loadCompanionOrchestrateSession);
    expect(logCompanionFeedbackVoteWithRepository).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(logCompanionFullviewOpenedWithRepository).not.toBe(nextExpandedWithLazyFetch);
    expect(logCompanionFeedbackVote).not.toBe(pauseCompanionUiStepCompletion);
    expect(logCompanionFullviewOpened).not.toBe(invalidateCompanionUiCompletionQuery);
    expect(companionAnalyticsRepository).not.toBe(companionOrchestrator);
    expect(companionAnalyticsRepository).not.toBe(companionPauseRepository);
  });

  it('orchestration-io exports stay off analytics write helpers', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(logCompanionFeedbackVote);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(logCompanionFullviewOpened);
    expect(nextExpandedWithLazyFetch).not.toBe(logCompanionFeedbackVoteWithRepository);
    expect(pauseCompanionUiStepCompletion).not.toBe(logCompanionFullviewOpenedWithRepository);
    expect(invalidateCompanionUiCompletionQuery).not.toBe(logCompanionFeedbackVote);
    expect(companionOrchestrator).not.toBe(companionAnalyticsRepository);
    expect(companionPauseRepository).not.toBe(companionAnalyticsRepository);
  });
});
