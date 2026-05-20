import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBreathSegmentRpcLoggers } from './use-pause-breath-segment-rpc-loggers';
import { showPauseStepSyncFailedToast } from '@/features/pause/application/use-cases/feedback/step-sync-toast';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

const { pauseLogStepMock, invalidateCompanionUiCompletionQueryMock } = vi.hoisted(() => ({
  pauseLogStepMock: vi.fn(),
  invalidateCompanionUiCompletionQueryMock: vi.fn(),
}));

async function mockBreathSegmentLog(
  input: { pauseInstanceId: string | null; segmentAlreadyLogged?: boolean },
  payload: Record<string, unknown>,
) {
  if (!input.pauseInstanceId) return { status: 'no_instance' as const };
  if (input.segmentAlreadyLogged) return { status: 'already_logged' as const };
  try {
    await pauseLogStepMock({
      instanceId: input.pauseInstanceId,
      stepType: 'breath_completed',
      payload,
    });
    invalidateCompanionUiCompletionQueryMock(input.pauseInstanceId);
    return { status: 'success' as const, markSegmentLogged: true as const };
  } catch {
    return { status: 'sync_failed' as const };
  }
}

vi.mock('@/features/pause/public-rpc', () => ({
  ensureBreathSegment1Logged: (input: {
    pauseInstanceId: string | null;
    segmentAlreadyLogged: boolean;
    briefRitual?: boolean;
  }) =>
    mockBreathSegmentLog(input, {
      breath_segment: 1,
      ...(input.briefRitual ? { brief_ritual: true } : {}),
    }),
  ensureBreathSegment2Logged: (input: {
    pauseInstanceId: string | null;
    segmentAlreadyLogged: boolean;
  }) => mockBreathSegmentLog(input, { breath_segment: 2 }),
  logBreathSegment1Skipped: (input: {
    pauseInstanceId: string | null;
    opts?: { briefRitual?: boolean };
  }) =>
    mockBreathSegmentLog(
      { pauseInstanceId: input.pauseInstanceId },
      {
        breath_segment: 1,
        skipped: true,
        ...(input.opts?.briefRitual ? { brief_ritual: true } : {}),
      },
    ),
  logBreathSegment2Skipped: (input: { pauseInstanceId: string | null }) =>
    mockBreathSegmentLog(input, { breath_segment: 2, skipped: true }),
}));

vi.mock('@/features/pause/application/use-cases/feedback/step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    companionUiCompletionQueryKey: (id: string) => ['pause', 'companion-ui-completion', id] as const,
    invalidateCompanionUiCompletionQuery: (...args: unknown[]) =>
      invalidateCompanionUiCompletionQueryMock(...args),
  };
});

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseLogStepMock.mockReset();
  pauseLogStepMock.mockResolvedValue(undefined);
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
    expect(pauseLogStepMock).not.toHaveBeenCalled();
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
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(pauseLogStepMock.mock.calls[0][0]).toMatchObject({
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
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    await act(async () => {
      await result.current.ensureBreathSegment1Logged();
    });
    expect(pauseLogStepMock).toHaveBeenCalledTimes(2);
    expect(pauseLogStepMock.mock.calls[1][0]).toMatchObject({ instanceId: 'b' });
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
    expect(pauseLogStepMock).not.toHaveBeenCalled();
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
    expect(pauseLogStepMock).toHaveBeenCalledTimes(1);
    expect(pauseLogStepMock.mock.calls[0][0].payload).toEqual({
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
    expect(pauseLogStepMock.mock.calls[0][0].payload).toEqual({
      breath_segment: 1,
      brief_ritual: true,
      skipped: true,
    });
  });

  it('logBreathSegment1Skipped returns false and toasts on RPC failure', async () => {
    pauseLogStepMock.mockRejectedValueOnce(new Error('network'));
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
    expect(pauseLogStepMock.mock.calls[0][0].payload).toEqual({
      breath_segment: 2,
      skipped: true,
    });
  });
});
