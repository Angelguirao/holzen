import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  getHolzenQueryClient,
  setHolzenQueryClient,
} from '@/features/pause/infrastructure/holzen-query-client-ref';
import { invalidatePauseStatsDataForUser } from './invalidate-pause-stats';
import { pauseInstancePracticeXpQueryKey } from './pause-instance-practice-xp-query';
import { PRACTICE_SUMMARY_QUERY_KEY } from './practice-summary-query-key';

describe('invalidatePauseStatsDataForUser', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    setHolzenQueryClient(queryClient);
  });

  afterEach(() => {
    setHolzenQueryClient(null);
  });

  it('invalidates journey stats and optional per-instance practice XP', async () => {
    const userId = 'user-1';
    const pauseInstanceId = 'inst-1';
    const summarySpy = vi.spyOn(queryClient, 'invalidateQueries');

    invalidatePauseStatsDataForUser(userId, { pauseInstanceId });

    expect(summarySpy).toHaveBeenCalledWith({ queryKey: PRACTICE_SUMMARY_QUERY_KEY(userId) });
    expect(summarySpy).toHaveBeenCalledWith({
      queryKey: pauseInstancePracticeXpQueryKey(pauseInstanceId),
    });
  });

  it('no-ops when query client is not registered', () => {
    setHolzenQueryClient(null);
    expect(() => invalidatePauseStatsDataForUser('user-1', { pauseInstanceId: 'inst-1' })).not.toThrow();
    expect(getHolzenQueryClient()).toBeNull();
  });
});
