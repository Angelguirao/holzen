import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useBulkHoldApplyOutcomes } from './use-bulk-hold-apply-outcomes';

const applyBulkHoldOutcomesMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/application/use-cases/home/bulk-hold/apply-bulk-hold-outcomes', () => ({
  applyBulkHoldOutcomes: applyBulkHoldOutcomesMock,
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: {},
}));

vi.mock('@/features/pause/public-queries', () => ({
  invalidatePauseStatsDataForUser: vi.fn(),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

const t = ((key: string) => key) as import('i18next').TFunction;

beforeEach(() => {
  applyBulkHoldOutcomesMock.mockReset().mockResolvedValue({ status: 'ok', count: 1 });
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

    expect(applyBulkHoldOutcomesMock).toHaveBeenCalledWith(
      expect.anything(),
      [row],
      expect.any(Function),
    );
    expect(onSuccess).toHaveBeenCalledWith(1);
  });
});
