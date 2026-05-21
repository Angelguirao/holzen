import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const {
  ensureBreathSegment1LoggedMock,
  ensureBreathSegment2LoggedMock,
  logBreathSegment1SkippedMock,
  logBreathSegment2SkippedMock,
  showPauseStepSyncFailedToast,
} = vi.hoisted(() => ({
  ensureBreathSegment1LoggedMock: vi.fn(),
  ensureBreathSegment2LoggedMock: vi.fn(),
  logBreathSegment1SkippedMock: vi.fn(),
  logBreathSegment2SkippedMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  ensureBreathSegment1Logged: ensureBreathSegment1LoggedMock,
  ensureBreathSegment2Logged: ensureBreathSegment2LoggedMock,
  logBreathSegment1Skipped: logBreathSegment1SkippedMock,
  logBreathSegment2Skipped: logBreathSegment2SkippedMock,
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  ensureBreathSegment1LoggedMock.mockReset();
  ensureBreathSegment2LoggedMock.mockReset();
  logBreathSegment1SkippedMock.mockReset();
  logBreathSegment2SkippedMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();

  ensureBreathSegment1LoggedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  ensureBreathSegment2LoggedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  logBreathSegment1SkippedMock.mockImplementation(async (input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  logBreathSegment2SkippedMock.mockImplementation(async (input) => {
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
    expect(ensureBreathSegment1LoggedMock).toHaveBeenCalledWith({
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
    expect(ensureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(ensureBreathSegment1LoggedMock.mock.calls[0][0]).toMatchObject({
      pauseInstanceId: 'inst-1',
      segmentAlreadyLogged: false,
    });
    expect(ensureBreathSegment1LoggedMock.mock.calls[1][0]).toMatchObject({
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
    expect(ensureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(ensureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(ensureBreathSegment1LoggedMock.mock.calls[1][0]).toMatchObject({
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
    expect(logBreathSegment1SkippedMock).toHaveBeenCalledWith({ pauseInstanceId: null, opts: undefined });
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
    expect(logBreathSegment1SkippedMock).toHaveBeenCalledTimes(1);
    expect(ensureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    expect(ensureBreathSegment1LoggedMock.mock.calls[0][0].segmentAlreadyLogged).toBe(true);
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
    expect(logBreathSegment1SkippedMock).toHaveBeenCalledWith({
      pauseInstanceId: 'inst-1',
      opts: { briefRitual: true },
    });
  });

  it('logBreathSegment1Skipped returns false and toasts on RPC failure', async () => {
    logBreathSegment1SkippedMock.mockResolvedValueOnce({ status: 'sync_failed' });
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

  it('logBreathSegment2Skipped delegates to public-rpc facade', async () => {
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
    expect(logBreathSegment2SkippedMock).toHaveBeenCalledWith({ pauseInstanceId: 'inst-1' });
  });
});
