import { describe, expect, it, vi } from 'vitest';
import {
  pauseReflectFavoriteToggle,
  pauseReflectionStepLogOnce,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

const runPauseReflectionStepLogOnceMock = vi.hoisted(() => vi.fn());
const runPauseFavoriteToggleMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle')
    >();
    return {
      ...actual,
      runPauseFavoriteToggle: runPauseFavoriteToggleMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log')
    >();
    return {
      ...actual,
      runPauseReflectionStepLogOnce: runPauseReflectionStepLogOnceMock,
    };
  },
);

vi.mock('@/features/pause/domain/reflect/steps/favorite-toggle', () => ({
  shouldShowFavoriteProHint: vi.fn(),
}));

vi.mock('@/features/pause/domain/reflect/steps/reflection-step-log', () => ({
  shouldLogPauseReflectionStep: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectStepsRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

describe('pause-reflect-steps-io', () => {
  it('re-exports step gates from domain reflect steps helpers', () => {
    expect(shouldShowFavoriteProHint).toBeDefined();
    expect(shouldLogPauseReflectionStep).toBeDefined();
  });

  it('routes reflection_step log through default repository + storage', async () => {
    runPauseReflectionStepLogOnceMock.mockResolvedValue({ status: 'logged' });

    await pauseReflectionStepLogOnce({ pauseInstanceId: 'pi-1' });

    expect(runPauseReflectionStepLogOnceMock).toHaveBeenCalledWith(
      reflectPauseRepository,
      { pauseInstanceId: 'pi-1' },
      { storage: { storage: 'reflectionStepSessionStorage' } },
    );
    expect(reflectPauseRepository).toEqual({ port: 'reflectStepsRepository' });
  });

  it('routes favorite toggle through the default PauseRepository port adapter', async () => {
    runPauseFavoriteToggleMock.mockResolvedValue({ status: 'success', newValue: true });

    await pauseReflectFavoriteToggle({
      pauseInstanceId: 'pi-1',
      isFavorite: true,
    });

    expect(runPauseFavoriteToggleMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-1',
      isFavorite: true,
    });
  });
});
