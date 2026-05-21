import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePauseReflectionStepLog } from './use-pause-reflection-step-log';

const { logPauseReflectionStepOnceMock } = vi.hoisted(() => ({
  logPauseReflectionStepOnceMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  logPauseReflectionStepOnce: logPauseReflectionStepOnceMock,
}));

beforeEach(() => {
  logPauseReflectionStepOnceMock.mockReset().mockResolvedValue(undefined);
});

describe('usePauseReflectionStepLog', () => {
  it('logs reflection_step once when copy is ready', async () => {
    renderHook(() =>
      usePauseReflectionStepLog({
        pauseInstanceId: 'pause-1',
        reflectionLoading: false,
        reflectionMessage: 'Breathe with the move.',
        reflectionError: null,
      }),
    );

    await waitFor(() => {
      expect(logPauseReflectionStepOnceMock).toHaveBeenCalledWith('pause-1');
    });
  });

  it('does not log while loading or without copy', async () => {
    const { rerender } = renderHook(
      (props: Parameters<typeof usePauseReflectionStepLog>[0]) => usePauseReflectionStepLog(props),
      {
        initialProps: {
          pauseInstanceId: 'pause-1',
          reflectionLoading: true,
          reflectionMessage: '',
          reflectionError: null,
        },
      },
    );

    expect(logPauseReflectionStepOnceMock).not.toHaveBeenCalled();

    rerender({
      pauseInstanceId: 'pause-1',
      reflectionLoading: false,
      reflectionMessage: '',
      reflectionError: null,
    });

    expect(logPauseReflectionStepOnceMock).not.toHaveBeenCalled();
  });
});
