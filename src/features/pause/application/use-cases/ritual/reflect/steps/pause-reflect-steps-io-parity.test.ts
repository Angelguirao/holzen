import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' }
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle', () => ({
  runPauseFavoriteToggle: vi.fn(() => Promise.resolve({ status: 'success' as const, newValue: true }))
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update', () => ({
  runPauseReflectNoteUpdate: vi.fn(() => Promise.resolve({ status: 'success' as const }))
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update', () => ({
  runPauseReflectTagUpdate: vi.fn(() => Promise.resolve({ status: 'success' as const }))
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log', () => ({
  runPauseReflectionStepLogOnce: vi.fn(() => Promise.resolve({ status: 'logged' as const }))
}));

import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import { runPauseFavoriteToggle as runFavoriteToggleDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import { runPauseReflectNoteUpdate as runNoteUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update';
import { runPauseReflectTagUpdate as runTagUpdateDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { runPauseReflectionStepLogOnce as runReflectionStepLogDirect } from '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log';
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
  shouldLogPauseReflectionStep as shouldLogFromStepsIo,
  shouldShowFavoriteProHint as shouldShowFromStepsIo
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository
} from '@/features/pause/presentation/feel/pause-feel-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildPauseScoreImpacts,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';
import {
  buildReflectionShareText,
  pauseReflectionShareImage
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  reflectionStepSessionStorage,
  supabasePauseRepository
} from '@/features/pause/public-rpc';

/**
 * Application steps I/O parity (colocated beside `pause-reflect-steps-flow.ts`).
 * Presentation mirror: `presentation/reflect/steps/pause-reflect-steps-io-parity.test.ts`
 * (default + *WithRepository delegation parity for run-* leaves + repository).
 * Ambience-io sibling: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `ambience/pause-reflect-ambience-io-parity.test.ts` (application + presentation).
 * Mood-io sibling: `pause-reflect-steps-feel-io-sibling-parity.test.ts`;
 * reciprocal inline pins ↔ `presentation/feel/pause-feel-io-parity.test.ts`.
 * Telemetry-io sibling: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts`;
 * reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 * Flows-io sibling: `pause-reflect-flows-steps-io-sibling-parity.test.ts`;
 * reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
 * Generation-io sibling: `pause-reflect-steps-generation-io-sibling-parity.test.ts`;
 * reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
 * Pending-offer-io sibling: `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts`;
 * reciprocal inline pins ↔ `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
 * Session step-handlers-io: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` (application);
 * reciprocal inline pins ↔ `presentation/session/pause-session-step-handlers-io-parity.test.ts`.
 */
describe('pause-reflect-steps-io parity (application)', () => {
  it('presentation I/O step gate re-exports match steps CI umbrella', () => {
    expect(shouldShowFavoriteProHint).toBe(shouldShowFromStepsIo);
    expect(shouldLogPauseReflectionStep).toBe(shouldLogFromStepsIo);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('steps CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(runPauseFavoriteToggle).toBe(runFavoriteToggleDirect);
    expect(runPauseReflectNoteUpdate).toBe(runNoteUpdateDirect);
    expect(runPauseReflectTagUpdate).toBe(runTagUpdateDirect);
    expect(runPauseReflectionStepLogOnce).toBe(runReflectionStepLogDirect);
  });

  it('presentation I/O exports step RPC wrappers distinct from leaf use cases', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof pauseReflectTagUpdateWithRepository).toBe('function');
    expect(typeof pauseReflectNoteUpdateWithRepository).toBe('function');
    expect(typeof pauseReflectFavoriteToggleWithRepository).toBe('function');
    expect(typeof pauseReflectionStepLogOnceWithRepository).toBe('function');
    expect(pauseReflectFavoriteToggle).not.toBe(runFavoriteToggleDirect);
    expect(pauseReflectNoteUpdate).not.toBe(runNoteUpdateDirect);
    expect(pauseReflectTagUpdate).not.toBe(runTagUpdateDirect);
    expect(pauseReflectionStepLogOnce).not.toBe(runReflectionStepLogDirect);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(runReflectionStepLogDirect);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
  });

  it('pauseReflectTagUpdate delegates to run-pause-reflect-tag-update with default repository', async () => {
    const input = { pauseInstanceId: 'inst-tags', tags: ['focus'] };

    await pauseReflectTagUpdate(input);

    expect(runTagUpdateDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseReflectNoteUpdate delegates to run-pause-reflect-note-update with default repository', async () => {
    const input = { pauseInstanceId: 'inst-note', text: 'breathe' };

    await pauseReflectNoteUpdate(input);

    expect(runNoteUpdateDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseReflectFavoriteToggle delegates to run-pause-favorite-toggle with default repository', async () => {
    const input = { pauseInstanceId: 'inst-fav', isFavorite: true };

    await pauseReflectFavoriteToggle(input);

    expect(runFavoriteToggleDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseReflectionStepLogOnce delegates to run-pause-reflection-step-log with default repository + storage', async () => {
    const input = { pauseInstanceId: 'inst-reflection-step' };

    await pauseReflectionStepLogOnce(input);

    expect(runReflectionStepLogDirect).toHaveBeenCalledWith(
      supabasePauseRepository,
      input,
      { storage: reflectionStepSessionStorage },
    );
  });

  it('pauseReflectTagUpdateWithRepository delegates to run-pause-reflect-tag-update with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-tags-custom', tags: ['calm'] };

    await pauseReflectTagUpdateWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runTagUpdateDirect).toHaveBeenCalledWith(customRepository, input);
  });

  it('pauseReflectNoteUpdateWithRepository delegates to run-pause-reflect-note-update with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-note-custom', text: 'ground' };

    await pauseReflectNoteUpdateWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runNoteUpdateDirect).toHaveBeenCalledWith(customRepository, input);
  });

  it('pauseReflectFavoriteToggleWithRepository delegates to run-pause-favorite-toggle with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-fav-custom', isFavorite: false };

    await pauseReflectFavoriteToggleWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runFavoriteToggleDirect).toHaveBeenCalledWith(customRepository, input);
  });

  it('pauseReflectionStepLogOnceWithRepository forwards injected PauseRepository and storage port', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const customStorage = {
      canRead: () => true,
      isLogged: () => false,
      markLogged: vi.fn()
    };
    const input = { pauseInstanceId: 'inst-reflection-step-custom' };

    await pauseReflectionStepLogOnceWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
      { storage: customStorage },
    );

    expect(runReflectionStepLogDirect).toHaveBeenCalledWith(customRepository, input, {
      storage: customStorage
    });
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/ambience/pause-reflect-ambience-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-ambience-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdate).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnce).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldShowFromStepsIo).not.toBe(startPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `ambience/pause-reflect-ambience-io-parity.test.ts` (application + presentation).
  });

  /**
   * Reciprocal inline pins ↔ `presentation/feel/pause-feel-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-feel-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: mood-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectNoteUpdate).not.toBe(pauseInitialEmotionSkip);
    expect(pauseReflectionStepLogOnce).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    // Reciprocal inline pins: `presentation/feel/pause-feel-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: telemetry-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectNoteUpdate).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectionStepLogOnce).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts` and
   * `application/.../flows/pause-reflect-flows-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionStepLogOnce).not.toBe(resolvePauseDecideOutcomeFlow);
    // Reciprocal inline pins: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-generation-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(runReflectGeneration);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectGeneration);
    expect(pauseReflectionStepLogOnce).not.toBe(reflectGenerator);
    expect(shouldLogFromStepsIo).not.toBe(shouldCommitReflectGeneration);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`
   * and `application/.../pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: pending-offer-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectNoteUpdate).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectTagUpdate).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(getPendingPauseOfferDisplay);
    expect(shouldShowFromStepsIo).not.toBe(getPendingPauseOfferDisplay);
    expect(shouldLogFromStepsIo).not.toBe(pauseDeclinePendingOffer);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
    // Full pins: `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-steps-hub-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: hub-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnce).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(shouldLogFromStepsIo).not.toBe(resolveShiftFrameHubDonePresentation);
    // Reciprocal inline pins: `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/session/pause-session-step-handlers-io-parity.test.ts`.
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` (application).
   */
  it('sibling cluster: session step-handlers-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectionStepLogOnce).not.toBe(buildPauseSessionStepShellBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepRitualBundle);
    // Reciprocal inline pins: `presentation/session/pause-session-step-handlers-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `share/pause-reflect-share-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-share-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: share-io builders stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectNoteUpdate).not.toBe(buildReflectionShareText);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseReflectionShareImage);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildReflectionShareText);
    // Reciprocal inline pins: `share/pause-reflect-share-io-parity.test.ts`.
  });
});
