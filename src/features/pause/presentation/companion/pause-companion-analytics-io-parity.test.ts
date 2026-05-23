/**
 * Presentation I/O parity (colocated beside `pause-companion-analytics-io.ts`).
 * Application mirror: `application/use-cases/ritual/frame/pause-companion-analytics-io-parity.test.ts` (colocated beside analytics-flow).
 * Imports `pause-companion-analytics-flow` CI umbrella for `.toBe` identity pins only —
 * production analytics I/O keeps ritual/frame leaf imports.
 * Orchestrate distinctness sibling: `application/.../frame/pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`
 * + `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts` (presentation).
 * Leaf + flow re-export pins also live in `pause-companion-analytics-io.re-exports.test.ts`.
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

import { runLogCompanionFeedbackVote as runFeedbackVoteDirect } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened as runFullviewOpenedDirect } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow';
import {
  companionAnalyticsRepository,
  runLogCompanionFeedbackVote as runFeedbackVoteFromAnalyticsIo,
  runLogCompanionFullviewOpened as runFullviewOpenedFromAnalyticsIo,
} from './pause-companion-analytics-io';
import {
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationIo,
  pauseLoadCompanionOrchestrateSession,
} from './pause-companion-orchestration-io';
import {
  runCompanionInterventionBootstrap as runInterventionFromOrchestrateIo,
  runCompanionSlotOrchestrate as runSlotOrchestrateFromOrchestrateIo,
} from './pause-companion-orchestrate-io';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

describe('pause-companion-analytics-io parity', () => {
  it('presentation I/O analytics exports match pause-companion-analytics-flow CI umbrella', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteFromAnalyticsIo);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedFromAnalyticsIo);
  });

  it('analytics-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteDirect);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedDirect);
    expect(runFeedbackVoteFromAnalyticsIo).toBe(runFeedbackVoteDirect);
    expect(runFullviewOpenedFromAnalyticsIo).toBe(runFullviewOpenedDirect);
  });

  it('binds default companionAnalyticsRepository to public-rpc supabasePauseAnalyticsRepository', () => {
    expect(companionAnalyticsRepository).toBe(supabasePauseAnalyticsRepository);
  });

  /**
   * Reciprocal inline pins ↔ `application/.../frame/pause-companion-analytics-io-parity.test.ts`.
   * Dedicated siblings: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`,
   * `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`,
   * `pause-companion-analytics-orchestration-io-sibling-parity.test.ts`.
   */
  it('analytics-flow CI umbrella exports stay distinct from orchestrate-io', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runLogCompanionFullviewOpened).not.toBe(runInterventionFromOrchestrateIo);
    expect(runFeedbackVoteFromAnalyticsIo).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runFullviewOpenedFromAnalyticsIo).not.toBe(runInterventionFromOrchestrateIo);
    expect(companionAnalyticsRepository).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    // Reciprocal inline pins: `application/.../pause-companion-analytics-io-parity.test.ts`.
  });

  it('sibling cluster: analytics-io exports stay distinct from orchestration-io', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(loadSessionFromOrchestrationIo);
    expect(runLogCompanionFullviewOpened).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(runFeedbackVoteFromAnalyticsIo).not.toBe(pauseLoadCompanionOrchestrateSession);
    expect(companionAnalyticsRepository).not.toBe(loadSessionFromOrchestrationIo);
    // Reciprocal inline pins: `application/.../pause-companion-analytics-io-parity.test.ts`.
  });
});
