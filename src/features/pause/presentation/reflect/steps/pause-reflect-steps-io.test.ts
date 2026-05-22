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
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
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
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
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

  it('sibling cluster: favorite and reflection_step log wrappers stay distinct on steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectionStepLogOnce);
    expect(shouldShowFavoriteProHint).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectFavoriteToggle).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectionStepLogOnce).not.toBe(shouldShowFavoriteProHint);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    // Full pins: `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-note-flow.test.ts` / `pause-reflect-tag-flow.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: note and tag wrappers stay distinct on steps-io', () => {
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseReflectTagUpdate).not.toBe(shouldShowFavoriteProHint);
    expect(shouldShowFavoriteProHint).not.toBe(pauseReflectNoteUpdate);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseReflectTagUpdate);
    // Reciprocal inline pins: `pause-reflect-note-flow.test.ts`, `pause-reflect-tag-flow.test.ts`.
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

  it('sibling cluster: hub-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectNoteUpdate).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnce).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(shouldShowFavoriteProHint).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(reflectPauseRepository).toBe(hubReflectPauseRepository);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-hub-io.test.ts`;
    // `pause-reflect-steps-hub-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: ambience-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdate).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectTagUpdate).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnce).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldShowFavoriteProHint).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(shouldLogPauseReflectionStep).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Full cross-I/O pins: reciprocal inline pins on `pause-reflect-ambience-io.test.ts`;
    // `pause-reflect-steps-ambience-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.test.ts` (reflect RPC vs session bundles).
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session step-handlers-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectTagUpdate).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnce).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(shouldShowFavoriteProHint).not.toBe(buildPauseSessionStepShellBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(buildPauseSessionStepRitualBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepRitualBundle);
    // Reciprocal inline pins: `pause-session-step-handlers-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io.test.ts` (step RPC wrappers vs reflect+decide).
   * Dedicated sibling file: `pause-reflect-flows-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-io exports stay distinct from steps-io', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionStepLogOnce).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(reflectPauseRepository).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(formatReinforcementQuoteFromSession);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(getSessionQuote);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(shouldShowFavoriteProHint).not.toBe(pauseReflectOutcomeLog);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Reciprocal inline pins: `pause-reflect-flows-io.test.ts`.
  });
});
