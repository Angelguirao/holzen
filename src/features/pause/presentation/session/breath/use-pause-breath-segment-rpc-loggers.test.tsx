import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const {
  pauseEnsureBreathSegment1LoggedMock,
  pauseEnsureBreathSegment2LoggedMock,
  pauseLogBreathSegment1SkippedMock,
  pauseLogBreathSegment2SkippedMock,
  showPauseStepSyncFailedToast,
} = vi.hoisted(() => ({
  pauseEnsureBreathSegment1LoggedMock: vi.fn(),
  pauseEnsureBreathSegment2LoggedMock: vi.fn(),
  pauseLogBreathSegment1SkippedMock: vi.fn(),
  pauseLogBreathSegment2SkippedMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/presentation/session/breath/pause-session-breath-io', async () => {
  const { initialBreathSegmentRpcLoggedFlagsFromRestored } = await vi.importActual<
    typeof import('@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow')
  >('@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow');
  const { applyBreathSegmentLogOutcome } = await vi.importActual<
    typeof import('@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome')
  >('@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome');
  return {
    initialBreathSegmentRpcLoggedFlagsFromRestored,
    applyBreathSegmentLogOutcome,
    pauseEnsureBreathSegment1Logged: pauseEnsureBreathSegment1LoggedMock,
    pauseEnsureBreathSegment2Logged: pauseEnsureBreathSegment2LoggedMock,
    pauseLogBreathSegment1Skipped: pauseLogBreathSegment1SkippedMock,
    pauseLogBreathSegment2Skipped: pauseLogBreathSegment2SkippedMock,
  };
});

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseEnsureBreathSegment1LoggedMock.mockReset();
  pauseEnsureBreathSegment2LoggedMock.mockReset();
  pauseLogBreathSegment1SkippedMock.mockReset();
  pauseLogBreathSegment2SkippedMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();

  pauseEnsureBreathSegment1LoggedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  pauseEnsureBreathSegment2LoggedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  pauseLogBreathSegment1SkippedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  pauseLogBreathSegment2SkippedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
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
    expect(pauseEnsureBreathSegment1LoggedMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
      segmentAlreadyLogged: true,
      briefRitual: undefined,
    });
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
    expect(pauseEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(pauseEnsureBreathSegment1LoggedMock.mock.calls[0][0]).toMatchObject({
      pauseInstanceId: 'inst-1',
      segmentAlreadyLogged: false,
    });
    expect(pauseEnsureBreathSegment1LoggedMock.mock.calls[1][0]).toMatchObject({
      pauseInstanceId: 'inst-1',
      segmentAlreadyLogged: true,
    });
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
    expect(pauseEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(pauseEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(pauseEnsureBreathSegment1LoggedMock.mock.calls[1][0]).toMatchObject({
      pauseInstanceId: 'b',
      segmentAlreadyLogged: false,
    });
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
    expect(pauseLogBreathSegment1SkippedMock).toHaveBeenCalledWith({
      pauseInstanceId: null,
      opts: undefined,
    });
  });

  it('logBreathSegment1Skipped marks segment logged and dedupes ensure', async () => {
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
    expect(pauseLogBreathSegment1SkippedMock).toHaveBeenCalledTimes(1);
    expect(pauseEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    expect(pauseEnsureBreathSegment1LoggedMock.mock.calls[0][0].segmentAlreadyLogged).toBe(true);
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
    expect(pauseLogBreathSegment1SkippedMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
      opts: { briefRitual: true },
    });
  });

  it('logBreathSegment1Skipped returns false and toasts on RPC failure', async () => {
    pauseLogBreathSegment1SkippedMock.mockResolvedValueOnce({ status: 'sync_failed' });
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
  });

  it('logBreathSegment2Skipped delegates to breath segment use case', async () => {
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
    expect(pauseLogBreathSegment2SkippedMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
    });
  });
});
