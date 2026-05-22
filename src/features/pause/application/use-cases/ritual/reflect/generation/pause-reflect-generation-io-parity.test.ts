import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation',
  () => ({
    runReflectGeneration: vi.fn(() =>
      Promise.resolve({ status: 'generated' as const, message: 'ok' }),
    ),
  }),
);

import { messageFromReflectGenerationResult as messageDirect } from '@/features/pause/domain/reflect/generation/message-from-reflect-generation-result';
import { reflectGenerationPrerequisite as prerequisiteDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-prerequisites';
import { reflectGenerationUserErrorMessage as userErrorDirect } from '@/features/pause/domain/reflect/generation/reflect-generation-errors';
import { resolveEffectiveReflectionCopy as resolveCopyDirect } from '@/features/pause/domain/reflect/generation/resolve-effective-reflection-copy';
import {
  resolveReflectGenerationPrefetch as resolvePrefetchDirect,
  shouldClearReflectGenerationLoading as shouldClearLoadingDirect,
  shouldCommitReflectGeneration as shouldCommitDirect,
} from '@/features/pause/domain/reflect/generation/reflect-generation-hook-flow';
import { runReflectGeneration as runReflectGenerationDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
import {
  messageFromReflectGenerationResult as messageFromGenerationIo,
  pauseReflectGeneration,
  reflectGenerationPrerequisite as prerequisiteFromGenerationIo,
  reflectGenerationUserErrorMessage as userErrorFromGenerationIo,
  reflectGenerator,
  resolveEffectiveReflectionCopy as resolveCopyFromGenerationIo,
  resolveReflectGenerationPrefetch as resolvePrefetchFromGenerationIo,
  runReflectGeneration as runReflectGenerationFromGenerationIo,
  shouldClearReflectGenerationLoading as shouldClearLoadingFromGenerationIo,
  shouldCommitReflectGeneration as shouldCommitFromGenerationIo,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

import { supabaseReflectGenerator } from '@/features/pause/public-rpc';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer generation I/O parity. Hub-io sibling:
 * `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation);
 * flows-io sibling: `pause-reflect-flows-generation-io-sibling-parity.test.ts`;
 * telemetry-io sibling: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`;
 * share-io sibling: `pause-reflect-generation-share-io-sibling-parity.test.ts`;
 * steps-io sibling: `pause-reflect-steps-generation-io-sibling-parity.test.ts` (reciprocal inline pins below).
 */
describe('pause-reflect-generation-io parity', () => {
  it('presentation I/O holzen-reflect exports match generation CI umbrella', () => {
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromGenerationIo);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingFromGenerationIo);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromGenerationIo);
    expect(messageFromReflectGenerationResult).toBe(messageFromGenerationIo);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromGenerationIo);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorFromGenerationIo);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyFromGenerationIo);
    expect(runReflectGeneration).toBe(runReflectGenerationFromGenerationIo);
  });

  it('generation CI umbrella composes the same domain + holzen-reflect leaf modules as presentation I/O', () => {
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchDirect);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearLoadingDirect);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitDirect);
    expect(messageFromReflectGenerationResult).toBe(messageDirect);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteDirect);
    expect(reflectGenerationUserErrorMessage).toBe(userErrorDirect);
    expect(resolveEffectiveReflectionCopy).toBe(resolveCopyDirect);
    expect(runReflectGeneration).toBe(runReflectGenerationDirect);
  });

  it('presentation I/O binds reflectGenerator to public-rpc supabaseReflectGenerator', () => {
    expect(reflectGenerator).toBe(supabaseReflectGenerator);
  });

  it('presentation I/O exports holzen-reflect RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(pauseReflectGeneration).not.toBe(runReflectGenerationDirect);
    expect(runReflectGeneration).not.toBe(pauseReflectGeneration);
  });

  it('pauseReflectGeneration delegates to run-reflect-generation with default generator', async () => {
    const input = {
      pauseInstanceId: 'inst-gen',
      userId: 'user-gen',
      context: 'btc',
      initialReflectionMessage: '',
      severityAbsPct: 50,
      profile: { display_name: 'Test' },
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input);

    expect(runReflectGenerationDirect).toHaveBeenCalledWith(input, supabaseReflectGenerator);
  });

  it('pauseReflectGeneration accepts injected ReflectGenerator port', async () => {
    const customGenerator = { port: 'customReflectGenerator' };
    const input = {
      pauseInstanceId: 'inst-gen-custom',
      userId: 'user-gen-custom',
      context: 'eth',
      initialReflectionMessage: 'seed',
      severityAbsPct: 10,
      profile: {},
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input, customGenerator as typeof supabaseReflectGenerator);

    expect(runReflectGenerationDirect).toHaveBeenCalledWith(input, customGenerator);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (holzen-reflect vs shift-frame hub).
   * Dedicated sibling file: `pause-reflect-generation-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(runReflectGeneration).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(reflectGenerationPrerequisite).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldCommitReflectGeneration).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(reflectGenerator).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseReflectGeneration).not.toBe(buildShiftEmotionFrameHubLogBundle);
    // Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (holzen-reflect vs reflect+decide flows).
   * Dedicated sibling file: `pause-reflect-flows-generation-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runReflectGeneration).not.toBe(pauseReflectOutcomeLog);
    expect(reflectGenerationPrerequisite).not.toBe(formatReinforcementQuoteFromSession);
    expect(resolveReflectGenerationPrefetch).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(shouldCommitReflectGeneration).not.toBe(buildPauseScoreImpacts);
    expect(messageFromReflectGenerationResult).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-generation-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-share-io-parity.test.ts` (holzen-reflect vs share builders).
   * Dedicated sibling file: `pause-reflect-generation-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectionShareImage);
    expect(runReflectGeneration).not.toBe(buildReflectionShareText);
    expect(reflectGenerationPrerequisite).not.toBe(buildReflectionShareTweetUrl);
    expect(resolveReflectGenerationPrefetch).not.toBe(buildReflectionShareTelegramUrl);
    expect(messageFromReflectGenerationResult).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(reflectGenerator).not.toBe(pauseReflectionShareImage);
    expect(shouldCommitReflectGeneration).not.toBe(buildReflectionShareText);
    // Reciprocal inline pins: `pause-reflect-share-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-telemetry-io-parity.test.ts` (holzen-reflect vs session UI telemetry).
   * Dedicated sibling file: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(reflectGenerator).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(reflectGenerationPrerequisite).not.toBe(trackPauseReflectWallpaperTap);
    // Reciprocal inline pins: `pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (holzen-reflect vs step RPC wrappers).
   * Dedicated sibling file: `pause-reflect-steps-generation-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectFavoriteToggle);
    expect(runReflectGeneration).not.toBe(pauseReflectNoteUpdate);
    expect(reflectGenerationPrerequisite).not.toBe(pauseReflectTagUpdate);
    expect(resolveReflectGenerationPrefetch).not.toBe(pauseReflectionStepLogOnce);
    expect(shouldCommitReflectGeneration).not.toBe(shouldShowFavoriteProHint);
    expect(messageFromReflectGenerationResult).not.toBe(shouldLogPauseReflectionStep);
    expect(reflectGenerator).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectGeneration).not.toBe(pauseReflectTagUpdate);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
    // Full pins: `pause-reflect-steps-generation-io-sibling-parity.test.ts`.
  });
});
