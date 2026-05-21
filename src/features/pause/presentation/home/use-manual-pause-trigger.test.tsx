import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useManualPauseTrigger } from './use-manual-pause-trigger';

const { openManualPauseFromHomeMock, clearSessionMock, markPauseManualStartedHomeOnceMock } =
  vi.hoisted(() => ({
    openManualPauseFromHomeMock: vi.fn(),
    clearSessionMock: vi.fn(),
    markPauseManualStartedHomeOnceMock: vi.fn(),
  }));

vi.mock('@/features/pause/public-rpc', () => ({
  openManualPauseFromHome: openManualPauseFromHomeMock,
  clearSession: clearSessionMock,
  markPauseManualStartedHomeOnce: markPauseManualStartedHomeOnceMock,
}));

vi.mock('@/lib/holzen-console', () => ({
  holzenLog: { manual: vi.fn() },
}));

const noopSet = vi.fn();

beforeEach(() => {
  openManualPauseFromHomeMock.mockReset().mockResolvedValue({
    outcome: 'idle',
    userMessage: 'Already open',
  });
  markPauseManualStartedHomeOnceMock.mockReset();
});

describe('useManualPauseTrigger', () => {
  it('opens manual pause via public-rpc facade', async () => {
    const user = { id: 'user-1' } as User;

    const { result } = renderHook(() =>
      useManualPauseTrigger({
        user,
        silentMode: true,
        cumulativeThreshold: 5,
        trackedAssetId: 'bitcoin',
        syncOpenPauseFromDb: vi.fn().mockResolvedValue(undefined),
        setError: noopSet,
        setLoading: noopSet,
        setMessage: noopSet,
        setContext: noopSet,
        setCompanions: noopSet,
        setNewPauseArrival: noopSet,
        setLastPauseInstanceId: noopSet,
        setLastTriggerAt: noopSet,
      }),
    );

    await act(async () => {
      await result.current.generateMessage(
        { changePercent: -2.5 } as import('@/features/market/public').BtcPriceData,
      );
    });

    expect(openManualPauseFromHomeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        silentMode: true,
        changePercent: -2.5,
      }),
    );
  });
});
