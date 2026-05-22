import { describe, expect, it, vi } from 'vitest';
import { runPauseFavoriteToggle as runFavoriteToggleDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepLogDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdate,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdate,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
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
  supabaseReflectGenerator: { port: 'reflectGenerator' },
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

  it('sibling cluster: share-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectNoteUpdate).not.toBe(buildReflectionShareText);
    expect(pauseReflectTagUpdate).not.toBe(buildReflectionShareTelegramUrl);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseReflectionShareImage);
    expect(shouldShowFavoriteProHint).not.toBe(buildReflectionShareText);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectFavoriteToggle).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseReflectNoteUpdate).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectionStepLogOnce).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildReflectionShareText);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseReflectionShareImage);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-share-io.test.ts`;
    // `pause-reflect-share-steps-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: generation-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectGeneration);
    expect(pauseReflectNoteUpdate).not.toBe(runReflectGeneration);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectGeneration);
    expect(pauseReflectionStepLogOnce).not.toBe(runReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseReflectFavoriteToggle).not.toBe(reflectGenerationPrerequisite);
    expect(pauseReflectNoteUpdate).not.toBe(shouldCommitReflectGeneration);
    expect(pauseReflectTagUpdate).not.toBe(resolveReflectGenerationPrefetch);
    expect(pauseReflectionStepLogOnce).not.toBe(messageFromReflectGenerationResult);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectGeneration);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(runReflectGeneration);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(reflectGenerationPrerequisite);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(shouldCommitReflectGeneration);
    expect(shouldShowFavoriteProHint).not.toBe(messageFromReflectGenerationResult);
    expect(shouldLogPauseReflectionStep).not.toBe(reflectGenerationPrerequisite);
    // Full cross-I/O pins: `pause-reflect-steps-generation-io-sibling-parity.test.ts`;
    // reciprocal inline pins: `pause-reflect-generation-io.test.ts`.
  });

  it('sibling cluster: note and tag wrappers stay distinct on steps-io', () => {
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    // Full pins: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: pending-offer-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectNoteUpdate).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectTagUpdate).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseReflectionStepLogOnce).not.toBe(getPendingPauseOfferDisplay);
    expect(shouldShowFavoriteProHint).not.toBe(pauseAdoptPendingOffer);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseDeclinePendingOffer);
    expect(shouldShowFavoriteProHint).not.toBe(getPendingPauseOfferDisplay);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-pending-offer-io.test.ts`;
    // `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts`.
  });
});
