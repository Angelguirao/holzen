import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePauseReflectionStepLog } from './use-pause-reflection-step-log';

const { runPauseReflectionStepLogOnceMock, mockPauseRepository, mockReflectionStepStorage } =
  vi.hoisted(() => ({
    runPauseReflectionStepLogOnceMock: vi.fn(),
    mockPauseRepository: { port: 'supabasePauseRepository' },
    mockReflectionStepStorage: { port: 'reflectionStepSessionStorage' },
  }));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/infrastructure/edge/reflect/reflection-step-session-storage', () => ({
  reflectionStepSessionStorage: mockReflectionStepStorage,
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log',
  () => ({
    runPauseReflectionStepLogOnce: runPauseReflectionStepLogOnceMock,
  }),
);

beforeEach(() => {
  runPauseReflectionStepLogOnceMock.mockReset().mockResolvedValue({ status: 'logged' });
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
      expect(runPauseReflectionStepLogOnceMock).toHaveBeenCalledWith(
        mockPauseRepository,
        { pauseInstanceId: 'pause-1' },
        { storage: mockReflectionStepStorage },
      );
    });
    expect(mockPauseRepository.port).toBe('supabasePauseRepository');
    expect(mockReflectionStepStorage.port).toBe('reflectionStepSessionStorage');
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

    expect(runPauseReflectionStepLogOnceMock).not.toHaveBeenCalled();

    rerender({
      pauseInstanceId: 'pause-1',
      reflectionLoading: false,
      reflectionMessage: '',
      reflectionError: null,
    });

    expect(runPauseReflectionStepLogOnceMock).not.toHaveBeenCalled();
  });
});
