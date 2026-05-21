import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const {
  runEnsureBreathSegment1LoggedMock,
  runEnsureBreathSegment2LoggedMock,
  runLogBreathSegment1SkippedMock,
  runLogBreathSegment2SkippedMock,
  showPauseStepSyncFailedToast,
  mockPauseRepository,
} = vi.hoisted(() => ({
  runEnsureBreathSegment1LoggedMock: vi.fn(),
  runEnsureBreathSegment2LoggedMock: vi.fn(),
  runLogBreathSegment1SkippedMock: vi.fn(),
  runLogBreathSegment2SkippedMock: vi.fn(),
  showPauseStepSyncFailedToast: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log',
  () => ({
    runEnsureBreathSegment1Logged: runEnsureBreathSegment1LoggedMock,
    runEnsureBreathSegment2Logged: runEnsureBreathSegment2LoggedMock,
    runLogBreathSegment1Skipped: runLogBreathSegment1SkippedMock,
    runLogBreathSegment2Skipped: runLogBreathSegment2SkippedMock,
  }),
);

vi.mock('@/features/pause/presentation/ritual/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast,
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  runEnsureBreathSegment1LoggedMock.mockReset();
  runEnsureBreathSegment2LoggedMock.mockReset();
  runLogBreathSegment1SkippedMock.mockReset();
  runLogBreathSegment2SkippedMock.mockReset();
  vi.mocked(showPauseStepSyncFailedToast).mockClear();

  runEnsureBreathSegment1LoggedMock.mockImplementation(async (_repo, input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  runEnsureBreathSegment2LoggedMock.mockImplementation(async (_repo, input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  runLogBreathSegment1SkippedMock.mockImplementation(async (_repo, input) => {
    if (!input.pauseInstanceId) return { status: 'no_instance' as const };
    return { status: 'success' as const, markSegmentLogged: true };
  });
  runLogBreathSegment2SkippedMock.mockImplementation(async (_repo, input) => {
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
    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledWith(
      mockPauseRepository,
      {
        pauseInstanceId: 'inst-1',
        segmentAlreadyLogged: true,
        briefRitual: undefined,
      },
      expect.anything(),
    );
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
    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(runEnsureBreathSegment1LoggedMock.mock.calls[0][1]).toMatchObject({
      pauseInstanceId: 'inst-1',
      segmentAlreadyLogged: false,
    });
    expect(runEnsureBreathSegment1LoggedMock.mock.calls[1][1]).toMatchObject({
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
    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(2);
    expect(runEnsureBreathSegment1LoggedMock.mock.calls[1][1]).toMatchObject({
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
    expect(runLogBreathSegment1SkippedMock).toHaveBeenCalledWith(
      mockPauseRepository,
      { pauseInstanceId: null, opts: undefined },
      expect.anything(),
    );
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
    expect(runLogBreathSegment1SkippedMock).toHaveBeenCalledTimes(1);
    expect(runEnsureBreathSegment1LoggedMock).toHaveBeenCalledTimes(1);
    expect(runEnsureBreathSegment1LoggedMock.mock.calls[0][1].segmentAlreadyLogged).toBe(true);
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
    expect(runLogBreathSegment1SkippedMock).toHaveBeenCalledWith(
      mockPauseRepository,
      {
        pauseInstanceId: 'inst-1',
        opts: { briefRitual: true },
      },
      expect.anything(),
    );
  });

  it('logBreathSegment1Skipped returns false and toasts on RPC failure', async () => {
    runLogBreathSegment1SkippedMock.mockResolvedValueOnce({ status: 'sync_failed' });
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
    expect(runLogBreathSegment2SkippedMock).toHaveBeenCalledWith(
      mockPauseRepository,
      { pauseInstanceId: 'inst-1' },
      expect.anything(),
    );
  });
});
