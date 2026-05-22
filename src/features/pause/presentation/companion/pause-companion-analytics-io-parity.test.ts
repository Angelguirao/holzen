import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow';
import {
  companionAnalyticsRepository,
  runLogCompanionFeedbackVote as runFeedbackVoteFromAnalyticsIo,
  runLogCompanionFullviewOpened as runFullviewOpenedFromAnalyticsIo,
} from '@/features/pause/presentation/companion/pause-companion-analytics-io';
import {
  runCompanionInterventionBootstrap as runInterventionFromOrchestrateIo,
  runCompanionSlotOrchestrate as runSlotOrchestrateFromOrchestrateIo,
} from '@/features/pause/presentation/companion/pause-companion-orchestrate-io';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

/**
 * Presentation I/O parity (colocated beside `pause-companion-analytics-io.ts`).
 * Imports `pause-companion-analytics-flow` CI umbrella for `.toBe` identity pins only — production analytics I/O keeps ritual/frame leaf imports.
 * Orchestrate distinctness sibling file: `application/.../frame/pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`;
 * presentation sibling: `pause-companion-analytics-orchestrate-io-sibling-parity.test.ts`.
 */
describe('pause-companion-analytics-io parity', () => {
  it('presentation I/O analytics exports match pause-companion-analytics-flow CI umbrella', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteFromAnalyticsIo);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedFromAnalyticsIo);
  });

  it('binds default companionAnalyticsRepository to public-rpc supabasePauseAnalyticsRepository', () => {
    expect(companionAnalyticsRepository).toBe(supabasePauseAnalyticsRepository);
  });

  it('analytics-flow CI umbrella exports stay distinct from orchestrate-io', () => {
    expect(runLogCompanionFeedbackVote).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runLogCompanionFullviewOpened).not.toBe(runInterventionFromOrchestrateIo);
    expect(runFeedbackVoteFromAnalyticsIo).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    expect(runFullviewOpenedFromAnalyticsIo).not.toBe(runInterventionFromOrchestrateIo);
    expect(companionAnalyticsRepository).not.toBe(runSlotOrchestrateFromOrchestrateIo);
    // Full pins: `pause-companion-analytics-orchestrate-flow-sibling-parity.test.ts`.
  });
});
