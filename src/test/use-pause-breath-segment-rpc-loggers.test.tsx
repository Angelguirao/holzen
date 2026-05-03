import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseBreathSegmentRpcLoggers } from '@/hooks/use-pause-breath-segment-rpc-loggers';
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';

const { pauseLogStepMock } = vi.hoisted(() => ({
  pauseLogStepMock: vi.fn(),
}));

vi.mock('@/lib/pause-api', () => ({
  pauseLogStep: (...args: unknown[]) => pauseLogStepMock(...args),
}));

vi.mock('@/lib/pause-step-sync-toast', () => ({
  showPauseStepSyncFailedToast: vi.fn(),
}));

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseLogStepMock.mockReset();
  pauseLogStepMock.mockResolvedValue(undefined);
  vi.mocked(showPauseStepSyncFailedToast).mockClear();
});

describe('usePauseBreathSegmentRpcLoggers', () => {
  it('skips segment 1 RPC when already logged on restore', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        initialSegment1Logged: true,
        initialSegment2Logged: false,
        t,
      }),
    );
    await act(async () => {
      const ok = await result.current.ensureBreathSegment1Logged();
      expect(ok).toBe(true);
    });
    expect(pauseLogStepMock).not.toHaveBeenCalled();
  });

  it('logs segment 1 once then short-circuits', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        initialSegment1Logged: false,
        initialSegment2Logged: false,
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
  });

  it('resets dedupe when pauseInstanceId changes', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) =>
        usePauseBreathSegmentRpcLoggers({
          pauseInstanceId: id,
          initialSegment1Logged: false,
          initialSegment2Logged: false,
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
  });

  it('logBreathSegment1Skipped returns true without RPC when no instance id', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: null,
        initialSegment1Logged: false,
        initialSegment2Logged: false,
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
        initialSegment1Logged: false,
        initialSegment2Logged: false,
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
        initialSegment1Logged: false,
        initialSegment2Logged: false,
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
        initialSegment1Logged: false,
        initialSegment2Logged: false,
        t,
      }),
    );
    await act(async () => {
      expect(await result.current.logBreathSegment1Skipped()).toBe(false);
    });
    expect(showPauseStepSyncFailedToast).toHaveBeenCalledWith(t);
  });

  it('logBreathSegment2Skipped sends segment 2 skipped payload', async () => {
    const { result } = renderHook(() =>
      usePauseBreathSegmentRpcLoggers({
        pauseInstanceId: 'inst-1',
        initialSegment1Logged: false,
        initialSegment2Logged: false,
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
