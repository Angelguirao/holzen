import { describe, expect, it, vi } from 'vitest';
import { runPauseFavoriteToggle as runFavoriteToggleDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepLogDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import {
  pauseAdoptPendingOffer,
  pauseDeclinePendingOffer,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

const runPauseReflectionStepLogOnceMock = vi.hoisted(() => vi.fn());
const runPauseFavoriteToggleMock = vi.hoisted(() => vi.fn());
const runPauseReflectNoteUpdateMock = vi.hoisted(() => vi.fn());
const runPauseReflectTagUpdateMock = vi.hoisted(() => vi.fn());

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

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update')
    >();
    return {
      ...actual,
      runPauseReflectNoteUpdate: runPauseReflectNoteUpdateMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update')
    >();
    return {
      ...actual,
      runPauseReflectTagUpdate: runPauseReflectTagUpdateMock,
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

  it('routes reflect tag update through the default PauseRepository port adapter', async () => {
    runPauseReflectTagUpdateMock.mockResolvedValue({ status: 'success' });

    await pauseReflectTagUpdate({ pauseInstanceId: 'pi-tags', tags: ['calm'] });

    expect(runPauseReflectTagUpdateMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-tags',
      tags: ['calm'],
    });
  });

  it('routes reflect note update through the default PauseRepository port adapter', async () => {
    runPauseReflectNoteUpdateMock.mockResolvedValue({ status: 'success' });

    await pauseReflectNoteUpdate({ pauseInstanceId: 'pi-note', text: 'breathe' });

    expect(runPauseReflectNoteUpdateMock).toHaveBeenCalledWith(reflectPauseRepository, {
      pauseInstanceId: 'pi-note',
      text: 'breathe',
    });
  });

  it('exports step RPC wrappers distinct from leaf use cases', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(runFavoriteToggleDirect);
    expect(pauseReflectNoteUpdate).not.toBe(runNoteUpdateDirect);
    expect(pauseReflectTagUpdate).not.toBe(runTagUpdateDirect);
    expect(pauseReflectionStepLogOnce).not.toBe(runReflectionStepLogDirect);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectNoteUpdate).not.toBe(pauseDeclinePendingOffer);
  });
});
