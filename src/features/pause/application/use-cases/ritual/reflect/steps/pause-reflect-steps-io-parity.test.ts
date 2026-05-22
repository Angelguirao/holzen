import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle', () => ({
  runPauseFavoriteToggle: vi.fn(() => Promise.resolve({ status: 'success' as const, newValue: true })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update', () => ({
  runPauseReflectNoteUpdate: vi.fn(() => Promise.resolve({ status: 'success' as const })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update', () => ({
  runPauseReflectTagUpdate: vi.fn(() => Promise.resolve({ status: 'success' as const })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflection-step-log', () => ({
  runPauseReflectionStepLogOnce: vi.fn(() => Promise.resolve({ status: 'logged' as const })),
}));

/**
 * Application-layer delegation parity for steps-flow ↔ steps-io (run-* leaves + repository).
 * Wrapper distinctness sibling file: `pause-reflect-steps-flow-io-wrapper-sibling-parity.test.ts`.
 * Favorite ↔ reflection_step log wrapper pins: presentation +
 * application `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts`
 * (reciprocal inline: `pause-reflect-steps-io.test.ts`); flow umbrellas:
 * `pause-favorite-toggle-reflection-step-log-flow-sibling-parity.test.ts`,
 * `pause-reflect-steps-favorite-reflection-step-log-flow-sibling-parity.test.ts`.
 * Note ↔ tag wrapper pins: presentation + application
 * `pause-reflect-steps-note-tag-io-sibling-parity.test.ts` (reciprocal inline:
 * `pause-reflect-steps-io.test.ts`); flow umbrellas:
 * `pause-reflect-note-tag-flow-sibling-parity.test.ts`,
 * `pause-reflect-steps-note-tag-flow-sibling-parity.test.ts`.
 * Flows-io cross-surface: `pause-reflect-flows-io-parity.test.ts` ↔ this file;
 * `pause-reflect-flows-steps-io-sibling-parity.test.ts` (application + presentation).
 * Steps-io ↔ mood-io: `pause-reflect-steps-mood-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts`.
 * Steps-io ↔ ambience-io: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts`.
 */
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
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
  shouldShowFavoriteProHint as shouldShowFromStepsIo,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
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
  reflectionStepSessionStorage,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';

describe('pause-reflect-steps-io parity', () => {
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
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(shouldShowFromStepsIo).not.toBe(shouldLogFromStepsIo);
    expect(pauseReflectFavoriteToggle).not.toBe(shouldLogFromStepsIo);
    expect(pauseReflectionStepLogOnce).not.toBe(shouldShowFromStepsIo);
    // Full pins: `pause-reflect-steps-favorite-reflection-step-log-io-sibling-parity.test.ts` (application + presentation).
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseReflectionStepLogOnceWithRepository);
    // Full pins: `pause-reflect-steps-note-tag-io-sibling-parity.test.ts` (application + presentation).
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
      markLogged: vi.fn(),
    };
    const input = { pauseInstanceId: 'inst-reflection-step-custom' };

    await pauseReflectionStepLogOnceWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
      { storage: customStorage },
    );

    expect(runReflectionStepLogDirect).toHaveBeenCalledWith(customRepository, input, {
      storage: customStorage,
    });
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io-parity.test.ts` (reflect RPC vs session bundles).
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` (application);
   * presentation mirror under `presentation/session/`.
   */
  it('sibling cluster: session step-handlers-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectTagUpdate).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnce).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(buildPauseSessionStepRitualBundle);
    expect(shouldShowFromStepsIo).not.toBe(buildPauseSessionStepShellBundle);
    expect(shouldLogFromStepsIo).not.toBe(buildPauseSessionStepRitualBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepShellBundle);
    expect(reflectPauseRepository).not.toBe(buildPauseSessionStepRitualBundle);
    // Reciprocal inline pins: `pause-session-step-handlers-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (step RPC wrappers vs hub done RPC).
   * Dedicated sibling file: `pause-reflect-steps-hub-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: hub-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectNoteUpdate).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnce).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(shouldShowFromStepsIo).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldLogFromStepsIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(pauseReflectFavoriteToggle).not.toBe(resolveShiftFrameHubDonePresentation);
    // Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts` (step RPC wrappers vs initial-emotion mood).
   * Dedicated sibling file: `pause-reflect-steps-mood-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectNoteUpdate).not.toBe(pauseInitialEmotionSkip);
    expect(pauseReflectTagUpdate).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseInitialEmotionSelect);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseInitialEmotionSkip);
    expect(shouldShowFromStepsIo).not.toBe(buildFeelTilesMoodLogOptions);
    expect(shouldLogFromStepsIo).not.toBe(pauseInitialEmotionSkip);
    // Reciprocal inline pins: `pause-reflect-mood-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (step RPC wrappers vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdate).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectTagUpdate).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnce).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldShowFromStepsIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(shouldLogFromStepsIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (step RPC wrappers vs reflect+decide).
   * Dedicated sibling file: `pause-reflect-flows-steps-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from steps-io wrappers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseReflectTagUpdate).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseReflectionStepLogOnce).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(shouldShowFromStepsIo).not.toBe(formatReinforcementQuoteFromSession);
    expect(shouldLogFromStepsIo).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseReflectFavoriteToggle).not.toBe(getSessionQuote);
    expect(pauseReflectNoteUpdate).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectTagUpdate).not.toBe(pauseReflectOutcomeLog);
    expect(pauseReflectNoteUpdate).not.toBe(pauseReflectTagUpdate);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-steps-io-sibling-parity.test.ts`.
  });
});
