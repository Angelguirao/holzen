import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
}));

import { runLogCompanionFeedbackVote as runFeedbackVoteDirect } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened as runFullviewOpenedDirect } from '@/features/pause/application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import {
  runLogCompanionFeedbackVote as runFeedbackVoteFromFlow,
  runLogCompanionFullviewOpened as runFullviewOpenedFromFlow,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow';
import { supabasePauseAnalyticsRepository } from '@/features/pause/public-rpc';

import {
  companionAnalyticsRepository,
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from './pause-companion-analytics-io';

describe('pause-companion-analytics-io re-exports', () => {
  it('re-exports ritual/frame analytics use cases from leaf modules', () => {
    expect(typeof runLogCompanionFeedbackVote).toBe('function');
    expect(typeof runLogCompanionFullviewOpened).toBe('function');

    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteDirect);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedDirect);
  });

  it('umbrella bindings match analytics-flow CI anchor (leaf parity)', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteFromFlow);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedFromFlow);
  });

  it('binds default companionAnalyticsRepository to public-rpc supabasePauseAnalyticsRepository', () => {
    expect(companionAnalyticsRepository).toBe(supabasePauseAnalyticsRepository);
  });
});
