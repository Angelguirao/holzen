import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-reflect-telemetry-flow';

import {
  buildPauseScoreImpacts,
  getSessionQuote,
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
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
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-io';

describe('pause-reflect-telemetry-io re-exports', () => {
  it('re-exports session reflect UI telemetry from ritual/reflect/telemetry leaf', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
  });

  it('presentation I/O bindings match pause-reflect-telemetry-flow CI anchor (leaf parity)', () => {
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryFlow);
  });

  it('sibling cluster: flows-io exports stay distinct from telemetry-io re-exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectOutcomeLog);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildPauseScoreImpacts);
    expect(trackPauseReflectPostItOpen).not.toBe(getSessionQuote);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io.re-exports.test.ts` (session reflect PostHog vs holzen-reflect generation).
   * Dedicated sibling file: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts` (presentation + application).
   */
  it('sibling cluster: generation-io re-exports stay distinct from telemetry-io re-exports', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(resolveReflectGenerationPrefetch);
    expect(trackPauseReflectShareTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(reflectGenerationPrerequisite);
    expect(trackPauseReflectShareTap).not.toBe(reflectGenerator);
    expect(trackPauseReflectWallpaperTap).not.toBe(shouldCommitReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(messageFromReflectGenerationResult);
    // Reciprocal inline pins: `pause-reflect-generation-io.re-exports.test.ts`.
  });
});
