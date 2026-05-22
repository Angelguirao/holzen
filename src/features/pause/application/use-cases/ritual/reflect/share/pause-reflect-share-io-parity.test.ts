/**
 * Application-layer I/O parity for ritual reflect share cluster (parity with
 * `pause-reflect-hub-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-share-io.ts`).
 * Imports share-flow + orchestration-flow CI umbrellas for `.toBe` identity pins only —
 * production share I/O keeps domain builders + `run-reflection-share-image` leaf imports.
 * Presentation mirror: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
 * Mood-io sibling: `pause-reflect-share-mood-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `mood/pause-reflect-mood-io-parity.test.ts`.
 * Hub-io sibling: `pause-reflect-hub-share-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `hub/pause-reflect-hub-io-parity.test.ts`.
 * Steps-io sibling: `pause-reflect-share-steps-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `steps/pause-reflect-steps-io-parity.test.ts`.
 * Ambience-io sibling: `pause-reflect-share-ambience-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `ambience/pause-reflect-ambience-io-parity.test.ts`.
 * Home-reflect-io sibling: reciprocal inline pins ↔ `generation/manual-open/pause-home-reflect-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image',
  () => ({
    runReflectionShareImage: vi.fn(() => Promise.resolve('downloaded' as const)),
  }),
);

import {
  deliverReflectionShareImage as deliverReflectionShareImageDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/share/deliver-reflection-share-image';
import {
  deliverReflectionShareImage,
  runReflectionShareImage as runReflectionShareImageFromOrchestration,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow';
import { runReflectionShareImage as runReflectionShareImageDirect } from '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import * as shareFlow from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import * as orchestrationFlow from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-orchestration-flow';
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
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryIo,
  trackPauseReflectShareTap as trackShareTapFromTelemetryIo,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
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
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareIo,
  buildReflectionShareText as buildTextFromShareIo,
  buildReflectionShareTweetUrl as buildTweetFromShareIo,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareIo,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

describe('pause-reflect-share-io parity (application)', () => {
  it('presentation I/O share builder exports match share CI umbrella', () => {
    expect(buildReflectionShareText).toBe(buildTextFromShareIo);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetFromShareIo);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramFromShareIo);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppFromShareIo);
  });

  it('share CI umbrella composes the same run-reflection-share-image leaf as presentation I/O', () => {
    expect(runReflectionShareImage).toBe(runReflectionShareImageDirect);
  });

  it('share-flow and orchestration-flow re-export the same runReflectionShareImage leaf as presentation I/O', () => {
    expect(runReflectionShareImage).toBe(runReflectionShareImageFromOrchestration);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
    expect(typeof pauseReflectionShareImage).toBe('function');
  });

  it('share orchestration CI umbrella composes deliver + run leaf modules', () => {
    expect(deliverReflectionShareImage).toBe(deliverReflectionShareImageDirect);
    expect(runReflectionShareImageFromOrchestration).toBe(runReflectionShareImageDirect);
  });

  it('share CI umbrella session UI telemetry matches presentation telemetry I/O', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryIo);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryIo);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryIo);
  });

  it('presentation share-io stays off deliver-reflection-share-image (orchestration-flow sibling parity)', () => {
    expect('deliverReflectionShareImage' in shareIo).toBe(false);
    expect('runReflectionShareImage' in shareIo).toBe(false);
    expect('trackPauseReflectPostItOpen' in shareIo).toBe(false);
    expect('trackPauseReflectShareTap' in shareIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in shareIo).toBe(false);
    expect(pauseReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(pauseReflectionShareImage).not.toBe(deliverReflectionShareImageDirect);
    expect(pauseReflectionShareImage).not.toBe(runReflectionShareImageFromOrchestration);
    expect(typeof pauseReflectionShareImage).toBe('function');
  });

  it('share-flow vs orchestration-flow CI namespaces stay separated (presentation share-io off both)', () => {
    expect('deliverReflectionShareImage' in shareFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in shareFlow).toBe(true);
    expect('deliverReflectionShareImage' in orchestrationFlow).toBe(true);
    expect('trackPauseReflectPostItOpen' in orchestrationFlow).toBe(false);
    expect(runReflectionShareImage).toBe(runReflectionShareImageFromOrchestration);
    expect(runReflectionShareImage).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectPostItOpen).not.toBe(deliverReflectionShareImage);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectionShareImageFromOrchestration);
  });

  it('presentation I/O share PNG wrapper delegates to run-reflection-share-image leaf', async () => {
    const message = 'breathe';
    const context = 'btc';
    const haiku = 'still water';
    const deps = { share: vi.fn() };

    await pauseReflectionShareImage(message, context, haiku, deps);

    expect(runReflectionShareImageDirect).toHaveBeenCalledWith(message, context, haiku, deps);
  });

  it('presentation share wrapper stays distinct from run-reflection-share-image leaf', () => {
    expect(pauseReflectionShareImage).not.toBe(runReflectionShareImageDirect);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-share-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from share-io wrappers', () => {
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildTextFromShareIo).not.toBe(pauseReflectOutcomeLog);
    expect(buildTelegramFromShareIo).not.toBe(formatReinforcementQuoteFromSession);
    expect(buildTweetFromShareIo).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(buildWhatsAppFromShareIo).not.toBe(buildPauseScoreImpacts);
    expect(pauseReflectionShareImage).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildTextFromShareIo).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Reciprocal inline pins: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from share-io wrappers', () => {
    expect(pauseReflectionShareImage).not.toBe(runReflectGeneration);
    expect(buildTextFromShareIo).not.toBe(pauseReflectGeneration);
    expect(buildTelegramFromShareIo).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildTweetFromShareIo).not.toBe(reflectGenerationPrerequisite);
    expect(buildWhatsAppFromShareIo).not.toBe(messageFromReflectGenerationResult);
    expect(pauseReflectionShareImage).not.toBe(reflectGenerator);
    expect(buildTextFromShareIo).not.toBe(shouldCommitReflectGeneration);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `telemetry/pause-reflect-telemetry-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `pause-reflect-share-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: telemetry-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(trackPostItFromTelemetryIo);
    expect(buildTextFromShareIo).not.toBe(trackShareTapFromTelemetryIo);
    expect(buildTelegramFromShareIo).not.toBe(trackWallpaperFromTelemetryIo);
    expect(buildTweetFromShareIo).not.toBe(trackPostItFromTelemetryIo);
    expect(buildWhatsAppFromShareIo).not.toBe(trackShareTapFromTelemetryIo);
    expect(pauseReflectionShareImage).not.toBe(trackWallpaperFromTelemetryIo);
    // Reciprocal inline pins: `telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseAdoptPendingOffer);
    expect(buildTextFromShareIo).not.toBe(pauseDeclinePendingOffer);
    expect(buildTelegramFromShareIo).not.toBe(getPendingPauseOfferDisplay);
    expect(buildTweetFromShareIo).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(buildWhatsAppFromShareIo).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseReflectionShareImage).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/steps/pause-reflect-steps-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-steps-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseReflectFavoriteToggle);
    expect(buildTextFromShareIo).not.toBe(pauseReflectNoteUpdate);
    expect(buildTelegramFromShareIo).not.toBe(pauseReflectTagUpdate);
    expect(buildTweetFromShareIo).not.toBe(pauseReflectionStepLogOnce);
    expect(buildWhatsAppFromShareIo).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(pauseReflectionShareImage).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(buildTextFromShareIo).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(buildTelegramFromShareIo).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildTweetFromShareIo).not.toBe(shouldShowFavoriteProHint);
    expect(buildWhatsAppFromShareIo).not.toBe(shouldLogPauseReflectionStep);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-hub-flow-sibling-parity.test.ts` (flow anchors).
   */
  it('sibling cluster: hub-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(buildTextFromShareIo).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(buildTelegramFromShareIo).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildTweetFromShareIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildWhatsAppFromShareIo).not.toBe(pauseShiftEmotionFrameHubDone);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/mood/pause-reflect-mood-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-mood-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseInitialEmotionSelect);
    expect(buildTextFromShareIo).not.toBe(pauseInitialEmotionSkip);
    expect(buildTelegramFromShareIo).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(buildTweetFromShareIo).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(buildWhatsAppFromShareIo).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseReflectionShareImage).not.toBe(buildFeelTilesMoodLogOptions);
  });

  /**
   * Reciprocal inline pins ↔ `generation/manual-open/pause-home-reflect-io-parity.test.ts`
   * (application + presentation).
   */
  it('sibling cluster: home-reflect-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(openManualPauseFromHome);
    expect(buildTextFromShareIo).not.toBe(dismissOpenPauseHome);
    expect(buildTelegramFromShareIo).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(buildTweetFromShareIo).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
    expect(buildWhatsAppFromShareIo).not.toBe(pauseHomeManualOpenPorts);
    expect(pauseReflectionShareImage).not.toBe(pauseHomeManualOpenPorts);
    // Reciprocal inline pins: `generation/manual-open/pause-home-reflect-io-parity.test.ts`,
    // `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `application/.../ambience/pause-reflect-ambience-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-ambience-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from share-io builders', () => {
    expect(pauseReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildTextFromShareIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildTelegramFromShareIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildTweetFromShareIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildWhatsAppFromShareIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectionShareImage).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
