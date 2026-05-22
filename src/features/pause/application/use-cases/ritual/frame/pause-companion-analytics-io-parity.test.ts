/**
 * Application companion analytics I/O parity (colocated beside `pause-companion-analytics-flow.ts`).
 * Presentation mirror: `presentation/companion/pause-companion-analytics-io-parity.test.ts`.
 * Imports analytics-flow CI umbrella for `.toBe` identity pins only — production analytics I/O keeps
 * ritual/frame leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import { runLogCompanionFeedbackVote as runFeedbackVoteDirect } from './run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened as runFullviewOpenedDirect } from './run-log-companion-fullview-opened';
import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-flow';
import {
  companionAnalyticsRepository,
  runLogCompanionFeedbackVote as runFeedbackVoteFromAnalyticsIo,
  runLogCompanionFullviewOpened as runFullviewOpenedFromAnalyticsIo,
} from '@/features/pause/presentation/companion/pause-companion-analytics-io';
import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationIo,
  pauseLoadCompanionOrchestrateSession,
} from '@/features/pause/presentation/companion/pause-companion-orchestration-io';
import {
  runCompanionInterventionBootstrap as runInterventionFromOrchestrateIo,
  runCompanionSlotOrchestrate as runSlotOrchestrateFromOrchestrateIo,
} from '@/features/pause/presentation/companion/pause-companion-orchestrate-io';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

describe('pause-companion-analytics-io parity (application)', () => {
  it('presentation analytics I/O matches pause-companion-analytics-flow CI umbrella', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteFromAnalyticsIo);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedFromAnalyticsIo);
  });

  it('analytics-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteDirect);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedDirect);
    expect(runFeedbackVoteFromAnalyticsIo).toBe(runFeedbackVoteDirect);
    expect(runFullviewOpenedFromAnalyticsIo).toBe(runFullviewOpenedDirect);
  });

  it('presentation I/O binds companionAnalyticsRepository to public-rpc supabasePauseAnalyticsRepository', () => {
    expect(companionAnalyticsRepository).toBe(supabasePauseAnalyticsRepository);
  });

  /**
   * Reciprocal inline pins ↔ presentation `pause-companion-analytics-io-parity.test.ts`.
   * Dedicated sibling files: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`,
   * `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`,
   * `pause-companion-analytics-orchestration-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: analytics-flow exports stay distinct from orchestrate-io', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runLogCompanionFullviewOpened).not.toBe(runInterventionFromOrchestrateIo);
    expect(runFeedbackVoteFromAnalyticsIo).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runFullviewOpenedFromAnalyticsIo).not.toBe(runInterventionFromOrchestrateIo);
    expect(companionAnalyticsRepository).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    // Reciprocal inline pins: `presentation/companion/pause-companion-analytics-io-parity.test.ts`.
  });

  it('sibling cluster: analytics-io exports stay distinct from orchestration-io', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(loadSessionFromOrchestrationIo);
    expect(runLogCompanionFullviewOpened).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(runFeedbackVoteFromAnalyticsIo).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(companionAnalyticsRepository).not.toBe(loadSessionFromOrchestrationIo);
    // Reciprocal inline pins: `presentation/companion/pause-companion-analytics-io-parity.test.ts`.
  });
});
