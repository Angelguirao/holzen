import { pauseApplyCronCalmSweepForSelf } from '@/features/pause/infrastructure/pause-rpc-client';

export type PauseApplyCronCalmSweepResult = {
  applied: boolean;
  reason?: string;
  expired_count?: number;
  calm_stamped?: boolean;
};

/** One-shot Home calm sweep — server validates thresholds; no polling. */
export async function runPauseApplyCronCalmSweepForSelf(input: {
  changePercent: number;
  direction: 'up' | 'down';
}): Promise<PauseApplyCronCalmSweepResult> {
  const raw = await pauseApplyCronCalmSweepForSelf(input);
  if (!raw || typeof raw !== 'object') {
    return { applied: false, reason: 'empty_response' };
  }
  const row = raw as Record<string, unknown>;
  return {
    applied: row.applied === true,
    reason: typeof row.reason === 'string' ? row.reason : undefined,
    expired_count: typeof row.expired_count === 'number' ? row.expired_count : undefined,
    calm_stamped: row.calm_stamped === true,
  };
}
