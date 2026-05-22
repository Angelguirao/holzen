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
  pauseReflectGeneration,
  reflectGenerator,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
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

/**
 * Presentation-layer telemetry I/O parity (colocated beside `pause-reflect-telemetry-io.ts`).
 * Application mirror: `application/.../ritual/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 * Mood-io sibling: `pause-reflect-mood-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts` (mood cluster).
 * Ambience-io sibling: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (ambience cluster).
 * Share-io sibling: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
 */
describe('pause-reflect-telemetry-io parity', () => {
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
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (session UI telemetry vs reflect+decide).
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
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (session UI telemetry vs step RPC wrappers).
   * Dedicated sibling file: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectFavoriteToggle);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectNoteUpdate);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectTagUpdate);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseReflectionStepLogOnce);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
    // Full pins: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (session UI telemetry vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(reflectGenerator);
    expect(trackPostItFromTelemetryIo).not.toBe(reflectGenerator);
    // Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts` (session UI telemetry vs share builders).
   * Dedicated sibling file: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(buildReflectionShareText);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildReflectionShareTelegramUrl);
    expect(trackPostItFromTelemetryIo).not.toBe(buildReflectionShareTweetUrl);
    expect(trackShareTapFromTelemetryIo).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(trackWallpaperFromTelemetryIo).not.toBe(pauseReflectionShareImage);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts` (session reflect telemetry vs feel-step mood RPC).
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
    // Reciprocal inline pins: `pause-reflect-mood-io-parity.test.ts`.
    // Full pins: `pause-reflect-mood-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (session reflect telemetry vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` (presentation).
   */
  it('sibling cluster: ambience-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPostItFromTelemetryIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackShareTapFromTelemetryIo).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackWallpaperFromTelemetryIo).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`.
  });
});
