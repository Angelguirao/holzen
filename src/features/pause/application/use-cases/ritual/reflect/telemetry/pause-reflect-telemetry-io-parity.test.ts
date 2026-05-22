/**
 * Application-layer I/O parity for ritual reflect session UI telemetry (parity with
 * `pause-reflect-mood-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-telemetry-io.ts`).
 * Imports `pause-reflect-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production telemetry I/O keeps `pause-reflect-session-ui-telemetry` leaf imports.
 * Presentation mirror: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromShareFlow,
  trackPauseReflectShareTap as trackShareTapFromShareFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromShareFlow,
  buildReflectionShareText as buildShareTextFromShareFlow,
  runReflectionShareImage as runShareImageFromShareFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryIo,
  trackPauseReflectShareTap as trackShareTapFromTelemetryIo,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  formatReinforcementQuoteFromSession as formatQuoteFromFlowsFlow,
  resolvePauseSessionReflectAndDecidePreflight as resolvePreflightFromFlowsFlow,
  runPauseOutcomeLog as runOutcomeLogFromFlowsFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import {
  openManualPauseFromHome as openManualFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-flow';
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
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  pauseReflectGeneration,
  reflectGenerator,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect as pauseInitialEmotionSelectFromMoodIo,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkip as pauseInitialEmotionSkipFromMoodIo,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository,
  resolvePauseSessionChromeCloseAction,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodFlow,
  resolvePauseSessionChromeCloseAction as resolveChromeCloseFromMoodFlow,
  runInitialEmotionSelect as runInitialEmotionSelectFromMoodFlow,
  runInitialEmotionSkip as runInitialEmotionSkipFromMoodFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/mood/pause-reflect-mood-flow';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseDeclinePendingOffer,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubFlow,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubFlow,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromHubFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
import {
  dismissOpenPauseHome as dismissFromHomeIo,
  openManualPauseFromHome as openFromHomeIo,
  pauseDismissOpenPauseHomePreview,
  pauseHomeManualOpenPorts,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';

describe('pause-reflect-telemetry-io parity (application)', () => {
  it('presentation I/O session reflect telemetry matches telemetry CI umbrella', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryIo);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryIo);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryIo);
  });

  it('telemetry CI umbrella composes the same session UI telemetry leaf as presentation I/O', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
    expect(trackPostItFromTelemetryIo).toBe(trackPostItDirect);
    expect(trackShareTapFromTelemetryIo).toBe(trackShareTapDirect);
    expect(trackWallpaperFromTelemetryIo).toBe(trackWallpaperDirect);
  });

  it('share-flow and telemetry-flow re-export the same session UI telemetry leaf', () => {
    expect(trackPostItFromShareFlow).toBe(trackPauseReflectPostItOpen);
    expect(trackShareTapFromShareFlow).toBe(trackPauseReflectShareTap);
    expect(trackWallpaperFromShareFlow).toBe(trackPauseReflectWallpaperTap);
    expect(trackPostItFromShareFlow).toBe(trackPostItDirect);
    expect(trackShareTapFromShareFlow).toBe(trackShareTapDirect);
    expect(trackWallpaperFromShareFlow).toBe(trackWallpaperDirect);
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(trackPauseReflectShareTap).not.toBe(formatReinforcementQuoteFromSession);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(trackPauseReflectPostItOpen).not.toBe(getSessionQuote);
    expect(trackPauseReflectShareTap).not.toBe(buildPauseScoreImpacts);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: flows-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectShareTap).not.toBe(resolvePreflightFromFlowsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(formatQuoteFromFlowsFlow);
    expect(trackPostItDirect).not.toBe(runOutcomeLogFromFlowsFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectFavoriteToggle);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectNoteUpdate);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectTagUpdate);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseReflectionStepLogOnce);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: steps-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runFavoriteFromStepsFlow);
    expect(trackPauseReflectShareTap).not.toBe(runNoteFromStepsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runTagFromStepsFlow);
    expect(trackPostItDirect).not.toBe(runReflectionStepFromStepsFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(reflectGenerator);
    expect(trackPostItFromTelemetryIo).not.toBe(reflectGenerator);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: generation-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(trackPauseReflectShareTap).not.toBe(openManualFromGenerationFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectGenerationFromGenerationFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(buildReflectionShareText);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildReflectionShareTelegramUrl);
    expect(trackPostItFromTelemetryIo).not.toBe(buildReflectionShareTweetUrl);
    expect(trackShareTapFromTelemetryIo).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(trackWallpaperFromTelemetryIo).not.toBe(pauseReflectionShareImage);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: share-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(buildShareTextFromShareFlow);
    expect(trackPauseReflectShareTap).not.toBe(runShareImageFromShareFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildShareTextFromShareFlow);
    expect(trackPostItDirect).not.toBe(runShareImageFromShareFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-mood-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSelectFromMoodIo);
    expect(trackPauseReflectShareTap).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseInitialEmotionSkipFromMoodIo);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(trackShareTapFromTelemetryIo).not.toBe(buildFeelTilesMoodLogOptions);
    expect(trackWallpaperFromTelemetryIo).not.toBe(resolvePauseSessionChromeCloseAction);
    expect(trackPauseReflectPostItOpen).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: mood-flow leaf exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(trackPauseReflectShareTap).not.toBe(runInitialEmotionSkipFromMoodFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildFeelTilesFromMoodFlow);
    expect(trackPostItDirect).not.toBe(resolveChromeCloseFromMoodFlow);
    expect(trackShareTapDirect).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(trackWallpaperDirect).not.toBe(runInitialEmotionSkipFromMoodFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-hub-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(trackPauseReflectShareTap).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPostItFromTelemetryIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(trackShareTapFromTelemetryIo).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(trackWallpaperFromTelemetryIo).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: hub-flow leaf exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runShiftHubDoneFromHubFlow);
    expect(trackPauseReflectShareTap).not.toBe(buildLogBundleFromHubFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolvePresentationFromHubFlow);
    expect(trackPostItDirect).not.toBe(runShiftHubDoneFromHubFlow);
    expect(trackShareTapDirect).not.toBe(buildLogBundleFromHubFlow);
    expect(trackWallpaperDirect).not.toBe(resolvePresentationFromHubFlow);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPostItFromTelemetryIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackShareTapFromTelemetryIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackWallpaperFromTelemetryIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Reciprocal inline pins ↔ `application/.../pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`
   * (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseAdoptPendingOffer);
    expect(trackPauseReflectShareTap).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseReflectWallpaperTap).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseAdoptPendingOffer);
    expect(trackShareTapFromTelemetryIo).not.toBe(pauseDeclinePendingOffer);
    expect(trackWallpaperFromTelemetryIo).not.toBe(getPendingPauseOfferDisplay);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
    // Reciprocal inline pins: `application/.../pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `generation/manual-open/pause-home-reflect-io-parity.test.ts` (application + presentation).
   * Dedicated sibling: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: home-reflect-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(openFromHomeIo);
    expect(trackPauseReflectShareTap).not.toBe(dismissFromHomeIo);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseDismissOpenPauseHomePreview);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseHomeManualOpenPorts);
    expect(trackShareTapFromTelemetryIo).not.toBe(openFromHomeIo);
    expect(trackWallpaperFromTelemetryIo).not.toBe(dismissFromHomeIo);
    expect(trackPostItDirect).not.toBe(pauseDismissOpenPauseHomePreview);
    // Reciprocal inline pins: `application/.../manual-open/pause-home-reflect-io-parity.test.ts`,
    // `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Reciprocal inline pins ↔ `application/.../telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`
   * (application + presentation).
   */
  it('sibling cluster: Home manual-open telemetry-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPauseOpenDismissed);
    expect(trackPauseReflectShareTap).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(trackPauseReflectWallpaperTap).not.toBe(markPauseManualStartedHomeOnce);
    expect(trackPostItFromTelemetryIo).not.toBe(trackManualPauseInstanceCreated);
    expect(trackShareTapFromTelemetryIo).not.toBe(trackPauseManualCompleted);
    expect(trackPostItDirect).not.toBe(trackPauseOpenDismissed);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
    // Reciprocal inline pins: `application/.../manual-open/pause-home-reflect-telemetry-io-parity.test.ts`.
  });
});
