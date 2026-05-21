import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/ritual/step-sync-toast';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const { logStepMock, invalidateCompanionUiCompletionQueryMock, mockRepository } = vi.hoisted(() => {
  const logStepMock = vi.fn();
  const invalidateCompanionUiCompletionQueryMock = vi.fn();
  return {
    logStepMock,
    invalidateCompanionUiCompletionQueryMock,
    mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
}));

vi.mock('@/features/pause/application/queries/companion-ui-completion-query-key', () => ({
  invalidateCompanionUiCompletionQuery: (...args: unknown[]) =>
    invalidateCompanionUiCompletionQueryMock(...args),
}));

vi.mock('@/features/pause/application/use-cases/ritual/step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logStepMock.mockReset();
  logStepMock.mockResolvedValue(null);
  invalidateCompanionUiCompletionQueryMock.mockReset();
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
    expect(invalidateCompanionUiCompletionQueryMock).not.toHaveBeenCalled();
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
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenCalledTimes(1);
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenCalledWith('inst-1');
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
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenCalledTimes(2);
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenNthCalledWith(1, 'a');
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenNthCalledWith(2, 'b');
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
    expect(invalidateCompanionUiCompletionQueryMock).not.toHaveBeenCalled();
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
