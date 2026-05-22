import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Application sibling parity: generation-io vs session reflect telemetry-io (parity with
 * `pause-reflect-generation-telemetry-flow-sibling-parity.test.ts` and presentation
 * `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts` ↔
 * `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts` ↔
 * `application/.../telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-generation-io ↔ pause-reflect-telemetry-io sibling parity (application)', () => {
  it('generation-io and session reflect telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in generationIo).toBe(false);
    expect('trackPauseReflectShareTap' in generationIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in generationIo).toBe(false);

    expect('runReflectGeneration' in telemetryIo).toBe(false);
    expect('pauseReflectGeneration' in telemetryIo).toBe(false);
    expect('reflectGenerationPrerequisite' in telemetryIo).toBe(false);
    expect('messageFromReflectGenerationResult' in telemetryIo).toBe(false);
    expect('shouldCommitReflectGeneration' in telemetryIo).toBe(false);
    expect('reflectGenerator' in telemetryIo).toBe(false);
  });

  it('holzen-reflect generation I/O stays off session reflect UI PostHog tap trackers', () => {
    expect(runReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(runReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(reflectGenerationPrerequisite).not.toBe(trackPauseReflectWallpaperTap);
    expect(messageFromReflectGenerationResult).not.toBe(trackPauseReflectPostItOpen);
    expect(shouldCommitReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(reflectGenerator).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('session reflect telemetry I/O stays off holzen-reflect generation wrappers and domain gates', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(reflectGenerationPrerequisite);
    expect(trackPauseReflectWallpaperTap).not.toBe(shouldCommitReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(messageFromReflectGenerationResult);
    expect(trackPauseReflectShareTap).not.toBe(reflectGenerator);
  });
});
