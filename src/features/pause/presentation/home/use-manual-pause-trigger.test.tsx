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
  mockPauseHomeManualOpenPorts,
} = vi.hoisted(() => ({
  openManualPauseFromHomeMock: vi.fn(),
  clearSessionMock: vi.fn(),
  markPauseManualStartedHomeOnceMock: vi.fn(),
  trackManualPauseInstanceCreatedMock: vi.fn(),
  trackPauseManualCompletedMock: vi.fn(),
  mockPauseHomeManualOpenPorts: {
    repository: { port: 'supabasePauseRepository' },
    reflect: { port: 'supabaseReflectGenerator' },
  },
}));

vi.mock('@/features/pause/presentation/session/pause-persisted-tab-session-io', () => ({
  clearPausePersistedTabSession: () => clearSessionMock(),
  loadPausePersistedTabSession: () => null,
  savePausePersistedTabSession: vi.fn(),
}));

vi.mock('@/features/pause/application/use-cases/trigger/manual-pause-trigger-telemetry', () => ({
  markPauseManualStartedHomeOnce: markPauseManualStartedHomeOnceMock,
  trackManualPauseInstanceCreated: trackManualPauseInstanceCreatedMock,
  trackPauseManualCompleted: trackPauseManualCompletedMock,
}));

vi.mock('./pause-home-io', () => ({
  pauseHomeManualOpenPorts: mockPauseHomeManualOpenPorts,
  pauseDismissOpenPauseHomePreview: vi.fn(),
  openManualPauseFromHome: openManualPauseFromHomeMock,
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
    contextText: 'ctx',
    silentMessage: 'silent',
    cumulativeChangePercent: null,
    fearGreedLabel: null,
    onChainBand: null,
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
      mockPauseHomeManualOpenPorts,
      expect.objectContaining({
        userId: 'user-1',
        silentMode: true,
        changePercent: -2.5,
      }),
    );
  });
});
