import { describe, expect, it } from 'vitest';

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
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

/**
 * Application telemetry I/O parity (colocated beside `pause-reflect-telemetry-flow.ts`).
 * Presentation mirror: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 * Ambience-io sibling: `ambience/pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts`.
 * Share-io sibling: `pause-reflect-share-telemetry-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
 */
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
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `flows/pause-reflect-flows-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: flows-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runOutcomeLogFromFlowsFlow);
    expect(trackPauseReflectShareTap).not.toBe(resolvePreflightFromFlowsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(formatQuoteFromFlowsFlow);
    expect(trackPostItDirect).not.toBe(runOutcomeLogFromFlowsFlow);
    // Reciprocal inline pins: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `flows/pause-reflect-flows-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (presentation).
   * Dedicated sibling file: `steps/pause-reflect-steps-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: steps-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runFavoriteFromStepsFlow);
    expect(trackPauseReflectShareTap).not.toBe(runNoteFromStepsFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runTagFromStepsFlow);
    expect(trackPostItDirect).not.toBe(runReflectionStepFromStepsFlow);
    // Reciprocal inline pins: `presentation/reflect/steps/pause-reflect-steps-io-parity.test.ts`.
    // Full pins: `steps/pause-reflect-steps-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (presentation).
   * Dedicated sibling file: `generation/pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(trackPauseReflectShareTap).not.toBe(openManualFromGenerationFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectGenerationFromGenerationFlow);
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
   * Dedicated sibling file: `share/pause-reflect-share-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: share-flow exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(buildShareTextFromShareFlow);
    expect(trackPauseReflectShareTap).not.toBe(runShareImageFromShareFlow);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildShareTextFromShareFlow);
    expect(trackPostItDirect).not.toBe(runShareImageFromShareFlow);
    // Reciprocal inline pins: `presentation/reflect/share/pause-reflect-share-io-parity.test.ts`.
    // Full pins: `share/pause-reflect-share-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (application + presentation).
   * Dedicated sibling file: `ambience/pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: ambience-io exports stay distinct from session reflect telemetry umbrella', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPostItDirect).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackShareTapDirect).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackWallpaperDirect).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts`.
    // Full pins: `ambience/pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`.
  });
});
