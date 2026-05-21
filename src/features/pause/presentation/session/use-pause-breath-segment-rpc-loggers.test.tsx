import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
} from '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const { logStepMock, showPauseStepSyncFailedToast, mockRepository } = vi.hoisted(() => {
  const logStepMock = vi.fn();
  return {
    logStepMock,
    showPauseStepSyncFailedToast: vi.fn(),
    mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
  };
});

const breathSegmentLogDeps = {
  onSegmentLogged: vi.fn(),
};

vi.mock('@/features/pause/public-rpc', () => ({
  ensureBreathSegment1Logged: (input: Parameters<typeof runEnsureBreathSegment1Logged>[1]) =>
    runEnsureBreathSegment1Logged(mockRepository, input, breathSegmentLogDeps),
  ensureBreathSegment2Logged: (input: Parameters<typeof runEnsureBreathSegment2Logged>[1]) =>
    runEnsureBreathSegment2Logged(mockRepository, input, breathSegmentLogDeps),
  logBreathSegment1Skipped: (input: Parameters<typeof runLogBreathSegment1Skipped>[1]) =>
    runLogBreathSegment1Skipped(mockRepository, input, breathSegmentLogDeps),
  logBreathSegment2Skipped: (input: Parameters<typeof runLogBreathSegment2Skipped>[1]) =>
    runLogBreathSegment2Skipped(mockRepository, input, breathSegmentLogDeps),
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logStepMock.mockReset();
  logStepMock.mockResolvedValue(null);
  breathSegmentLogDeps.onSegmentLogged.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseBreathSegmentRpcLoggers', () => {
  it('skips segment 1 RPC when already logged on restore', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: makeTestPersistedPauseSession({ step: 'reflect' }),
        t,
      }),
    );
    await act(async () => {
      const ok = await result.current.ensureBreathSegment1Logged();
      expect(ok).toBe(true);
    });
    expect(logStepMock).not.toHaveBeenCalled();
    expect(breathSegmentLogDeps.onSegmentLogged).not.toHaveBeenCalled();
  });

  it('logs segment 1 once then short-circuits', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: null,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.ensureBreathSegment1Logged()).toBe(true);
      expect(await result.current.ensureBreathSegment1Logged()).toBe(true);
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(logStepMock.mock.calls[0][0]).toMatchObject({
      instanceId: 'inst-1',
      stepType: 'breath_completed',
    });
    expect(breathSegmentLogDeps.onSegmentLogged).toHaveBeenCalledTimes(1);
    expect(breathSegmentLogDeps.onSegmentLogged).toHaveBeenCalledWith('inst-1');
  });

  it('resets dedupe when pauseInstanceId changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) =>
        usePauseBreathSegmentRpcLoggers({
          pauseInstanceId: id,
          restored: null,
          t,
        }),
      { initialProps: { id: 'a' as string | null } },
    );
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(logStepMock).toHaveBeenCalledTimes(2);
    expect(logStepMock.mock.calls[1][0]).toMatchObject({ instanceId: 'b' });
    expect(breathSegmentLogDeps.onSegmentLogged).toHaveBeenCalledTimes(2);
    expect(breathSegmentLogDeps.onSegmentLogged).toHaveBeenNthCalledWith(1, 'a');
    expect(breathSegmentLogDeps.onSegmentLogged).toHaveBeenNthCalledWith(2, 'b');
  });

  it('logBreathSegment1Skipped returns true without RPC when no instance id', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: null,
        restored: null,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.logBreathSegment1Skipped()).toBe(true);
    });
    expect(logStepMock).not.toHaveBeenCalled();
  });

  it('logBreathSegment1Skipped sends skipped payload and dedupes ensure', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: null,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.logBreathSegment1Skipped()).toBe(true);
      expect(await result.current.ensureBreathSegment1Logged()).toBe(true);
    });
    expect(logStepMock).toHaveBeenCalledTimes(1);
    expect(logStepMock.mock.calls[0][0].payload).toEqual({
      breath_segment: 1,
      skipped: true,
    });
  });

  it('logBreathSegment1Skipped forwards briefRitual', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: null,
        t,
      }),
    );
    await act(async () => {
      await result.current.logBreathSegment1Skipped({ briefRitual: true });
    });
    expect(logStepMock.mock.calls[0][0].payload).toEqual({
      breath_segment: 1,
      brief_ritual: true,
      skipped: true,
    });
  });

  it('logBreathSegment1Skipped returns false and toasts on RPC failure', async () => {
    logStepMock.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: null,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.logBreathSegment1Skipped()).toBe(false);
    });
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
    expect(breathSegmentLogDeps.onSegmentLogged).not.toHaveBeenCalled();
  });

  it('logBreathSegment2Skipped sends segment 2 skipped payload', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        restored: null,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.logBreathSegment2Skipped()).toBe(true);
    });
    expect(logStepMock.mock.calls[0][0].payload).toEqual({
      breath_segment: 2,
      skipped: true,
    });
  });
});
