import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useManualPauseTrigger } from './use-manual-pause-trigger';

const {
  openManualPauseFromHomeMock,
  clearSessionMock,
  markPauseManualStartedHomeOnceMock,
  trackManualPauseInstanceCreatedMock,
  trackPauseManualCompletedMock,
  mockPauseRepository,
  mockReflectGenerator,
} = vi.hoisted(() => ({
  openManualPauseFromHomeMock: vi.fn(),
  clearSessionMock: vi.fn(),
  markPauseManualStartedHomeOnceMock: vi.fn(),
  trackManualPauseInstanceCreatedMock: vi.fn(),
  trackPauseManualCompletedMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
  mockReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  clearSession: clearSessionMock,
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/infrastructure/supabase-reflect-generator', () => ({
  supabaseReflectGenerator: mockReflectGenerator,
}));

vi.mock('@/features/pause/application/use-cases/trigger/open-manual-pause-from-home', () => ({
  openManualPauseFromHome: openManualPauseFromHomeMock,
}));

vi.mock('@/features/pause/application/use-cases/trigger/manual-pause-trigger-telemetry', () => ({
  markPauseManualStartedHomeOnce: markPauseManualStartedHomeOnceMock,
  trackManualPauseInstanceCreated: trackManualPauseInstanceCreatedMock,
  trackPauseManualCompleted: trackPauseManualCompletedMock,
}));

vi.mock('@/features/pause/application/use-cases/trigger/build-manual-pause-open-params', () => ({
  buildManualPauseOpenParams: (input: {
    userId: string;
    silentMode: boolean;
    mood?: string;
    data: { changePercent: number };
    cumulativeThreshold: number;
    profileTrackedAssetId: string;
  }) => ({
    userId: input.userId,
    silentMode: input.silentMode,
    mood: input.mood,
    changePercent: input.data.changePercent,
    cumulativeThreshold: input.cumulativeThreshold,
    trackedAssetId: input.profileTrackedAssetId,
    assetId: input.profileTrackedAssetId,
    ctx: 'ctx',
    severityBand: 'low',
    silentMsg: 'silent',
  }),
}));

vi.mock('@/features/pause/application/use-cases/trigger/apply-manual-pause-open-result', () => ({
  applyManualPauseOpenResult: async (
    _input: { result: { outcome: string; userMessage?: string } },
    _ports: unknown,
  ) => ({ opened: false as const }),
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
  it('opens manual pause via use case + default port adapters', async () => {
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
      {
        repository: mockPauseRepository,
        reflect: mockReflectGenerator,
      },
      expect.objectContaining({
        userId: 'user-1',
        silentMode: true,
        changePercent: -2.5,
      }),
    );
  });
});
