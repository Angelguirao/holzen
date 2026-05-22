import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseAnalyticsRepository: { port: 'companionAnalyticsRepository' },
}));

import {
  runLogCompanionFeedbackVote,
  runLogCompanionFullviewOpened,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-analytics-flow';
import {
  runLogCompanionFeedbackVote as runFeedbackVoteFromAnalyticsIo,
  runLogCompanionFullviewOpened as runFullviewOpenedFromAnalyticsIo,
} from '@/features/pause/presentation/companion/pause-companion-analytics-io';

describe('pause-companion-analytics-io parity', () => {
  it('presentation I/O analytics exports match pause-companion-analytics-flow CI umbrella', () => {
    expect(runLogCompanionFeedbackVote).toBe(runFeedbackVoteFromAnalyticsIo);
    expect(runLogCompanionFullviewOpened).toBe(runFullviewOpenedFromAnalyticsIo);
  });
});
