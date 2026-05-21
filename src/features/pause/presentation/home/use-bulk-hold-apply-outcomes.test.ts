import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useBulkHoldApplyOutcomes } from './use-bulk-hold-apply-outcomes';

const { pauseApplyBulkHoldOutcomesMock } = vi.hoisted(() => ({
  pauseApplyBulkHoldOutcomesMock: vi.fn(),
}));

vi.mock('@/features/pause/presentation/home/pause-home-bulk-hold-io', () => ({
  pauseApplyBulkHoldOutcomes: pauseApplyBulkHoldOutcomesMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  invalidatePauseStatsDataForUser: vi.fn(),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((key: string) => key) as import('i18next').TFunction;

beforeEach(() => {
  pauseApplyBulkHoldOutcomesMock.mockReset().mockResolvedValue({ status: 'success', count: 1 });
});

describe('useBulkHoldApplyOutcomes', () => {
  it('applies outcomes via applyBulkHoldOutcomes + PauseRepository', async () => {
    const user = { id: 'user-1' } as User;
    const setPending = vi.fn();
    const bumpRefetchNonce = vi.fn();
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useBulkHoldApplyOutcomes({
        user,
        setPending,
        bumpRefetchNonce,
        t,
        onSuccess,
        onPartial: vi.fn(),
      }),
    );

    const row = {
      id: 'inst-1',
      created_at: '2026-05-01T00:00:00Z',
      context_snapshot: null,
    };

    await act(async () => {
      await result.current.applyOutcomesAndFinish([row], () => 'held');
    });

    expect(pauseApplyBulkHoldOutcomesMock).toHaveBeenCalledWith([row], expect.any(Function));
    expect(onSuccess).toHaveBeenCalledWith(1);
  });
});
