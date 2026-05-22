import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
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
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildReflectionShareText,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  openManualPauseFromHome,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import * as homeReflectIo from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';

import { supabaseReflectGenerator } from '@/features/pause/public-rpc';

/**
 * Application generation I/O parity (colocated beside `pause-reflect-generation-flow.ts`).
 * Presentation mirror: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
 * Imports generation-flow CI umbrella and domain hook bundle for `.toBe` identity pins only — production generation I/O keeps leaf imports.
 * Sibling parity files remain under `application/.../ritual/reflect/generation/` and sibling clusters when they assert flow umbrellas.
 * Home-reflect-io sibling: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `generation/manual-open/pause-home-reflect-io-parity.test.ts`.
 */
describe('pause-reflect-generation-io parity (application)', () => {
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
    expect(resolvePrefetchFromGenerationIo).toBe(resolvePrefetchDirect);
    expect(runReflectGenerationFromGenerationIo).toBe(runReflectGenerationDirect);
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
      pauseInstanceId: 'inst-gen-app',
      userId: 'user-gen-app',
      context: 'btc',
      initialReflectionMessage: '',
      severityAbsPct: 50,
      profile: { display_name: 'Test' },
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input);

    expect(runReflectGenerationDirect).toHaveBeenCalledWith(input, supabaseReflectGenerator);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectGenerationPrerequisite).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolveReflectGenerationPrefetch).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectGenerator).not.toBe(startPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `application/.../ambience/pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts` (presentation).
   * Dedicated sibling file: `pause-reflect-generation-mood-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseInitialEmotionSelect);
    expect(runReflectGeneration).not.toBe(pauseInitialEmotionSkip);
    expect(reflectGenerationPrerequisite).not.toBe(buildFeelTilesMoodLogOptions);
    expect(reflectGenerator).not.toBe(pauseInitialEmotionSelect);
    // Reciprocal inline pins: `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(runReflectGeneration).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(reflectGenerator).not.toBe(pauseShiftEmotionFrameHubDone);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(runReflectGeneration).not.toBe(pauseReflectOutcomeLog);
    expect(reflectGenerationPrerequisite).not.toBe(formatReinforcementQuoteFromSession);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-share-io-parity.test.ts` (presentation).
   */
  it('sibling cluster: share-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectionShareImage);
    expect(runReflectGeneration).not.toBe(buildReflectionShareText);
    expect(reflectGenerator).not.toBe(pauseReflectionShareImage);
  });

  /**
   * Reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: session reflect telemetry-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(reflectGenerator).not.toBe(trackPauseReflectPostItOpen);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectFavoriteToggle);
    expect(runReflectGeneration).not.toBe(pauseReflectNoteUpdate);
    expect(reflectGenerator).not.toBe(pauseReflectFavoriteToggle);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseAdoptPendingOffer);
    expect(runReflectGeneration).not.toBe(pauseDeclinePendingOffer);
    expect(reflectGenerator).not.toBe(getPendingPauseOfferDisplay);
    expect(reflectGenerationPrerequisite).not.toBe(pauseAdoptPendingOffer);
    expect(resolveReflectGenerationPrefetch).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseReflectGeneration).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(runReflectGeneration).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(reflectGenerator).not.toBe(reflectPauseRepository);
    expect(shouldCommitReflectGeneration).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(runReflectGeneration).not.toBe(getPendingPauseOfferDisplay);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts` (application + presentation).
    // Dedicated sibling: `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `generation/manual-open/pause-home-reflect-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: home-reflect-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(runReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerator).not.toBe(pauseHomeManualOpenPorts);
    expect(reflectGenerationPrerequisite).not.toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(reflectGenerationPrerequisite).not.toBe(buildManualPauseMarketContext);
    expect(resolveReflectGenerationPrefetch).not.toBe(runPersistSilentReflectionStub);
    expect(resolveReflectGenerationPrefetch).not.toBe(buildManualPauseOpenParams);
    expect(shouldCommitReflectGeneration).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(messageFromReflectGenerationResult).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
    expect(messageFromReflectGenerationResult).not.toBe(openManualPauseFromHome);
    expect(pauseReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(shouldCommitReflectGeneration).not.toBe(buildManualPauseCreateOrReuseParams);
    expect(pauseHomeManualOpenPorts.reflect).toBe(reflectGenerator);
    // Reciprocal inline pins: `generation/manual-open/pause-home-reflect-io-parity.test.ts`.
    // Full pins: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
   */
  it('application mirror: generation-io stays off home-reflect-io manual-open wrappers', () => {
    expect('openManualPauseFromHome' in generationIo).toBe(false);
    expect('pauseDismissOpenPauseHomePreview' in generationIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in generationIo).toBe(false);
    expect('runReflectGeneration' in homeReflectIo).toBe(false);
    expect('pauseReflectGeneration' in homeReflectIo).toBe(false);
    expect('pauseHomeManualOpenPorts' in homeReflectIo).toBe(true);
    expect('reflectGenerator' in generationIo).toBe(true);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });
});
