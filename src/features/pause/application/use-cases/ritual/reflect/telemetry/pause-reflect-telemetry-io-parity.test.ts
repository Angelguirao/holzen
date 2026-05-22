/**
 * Application-layer I/O parity for ritual reflect session UI telemetry (parity with
 * `pause-reflect-mood-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-telemetry-io.ts`).
 * Imports `pause-reflect-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production telemetry I/O keeps `pause-reflect-session-ui-telemetry` leaf imports.
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
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectionStepLogOnce,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  runReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  pauseInitialEmotionSelect,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import {
  startPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  pauseShiftEmotionFrameHubDone,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';

/**
 * Application mirror: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
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
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectShareTap).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectOutcomeLog);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-steps-telemetry-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectFavoriteToggle);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectionStepLogOnce);
    expect(trackPostItFromTelemetryIo).not.toBe(pauseReflectFavoriteToggle);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
   */
  it('sibling cluster: mood-io and hub-io exports stay distinct from session reflect telemetry-io', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseInitialEmotionSelect);
    expect(trackPauseReflectShareTap).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPostItDirect).not.toBe(runReflectGeneration);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
  });
});
