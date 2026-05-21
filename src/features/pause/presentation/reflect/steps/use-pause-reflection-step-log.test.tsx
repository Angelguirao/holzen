import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePauseReflectionStepLog } from './use-pause-reflection-step-log';

const { pauseReflectionStepLogOnceMock } = vi.hoisted(() => ({
  pauseReflectionStepLogOnceMock: vi.fn(),
}));

vi.mock('./pause-reflect-steps-io', () => ({
  pauseReflectionStepLogOnce: pauseReflectionStepLogOnceMock,
}));

beforeEach(() => {
  pauseReflectionStepLogOnceMock.mockReset().mockResolvedValue({ status: 'logged' });
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
      expect(pauseReflectionStepLogOnceMock).toHaveBeenCalledWith({
        pauseInstanceId: 'pause-1',
      });
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

    expect(pauseReflectionStepLogOnceMock).not.toHaveBeenCalled();

    rerender({
      pauseInstanceId: 'pause-1',
      reflectionLoading: false,
      reflectionMessage: '',
      reflectionError: null,
    });

    expect(pauseReflectionStepLogOnceMock).not.toHaveBeenCalled();
  });
});
