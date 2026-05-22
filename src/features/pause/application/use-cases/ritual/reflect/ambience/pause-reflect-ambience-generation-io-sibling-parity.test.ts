import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import * as generationIo from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Application sibling parity: ambience-io vs generation-io (parity with presentation
 * `pause-reflect-ambience-generation-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-ambience-generation-flow-sibling-parity.test.ts`).
 * Mood-io sibling: `pause-reflect-ambience-mood-io-sibling-parity.test.ts` (application + presentation).
 * Telemetry-io sibling: `pause-reflect-ambience-telemetry-io-sibling-parity.test.ts` (application + presentation).
 * Reciprocal inline pins: `pause-reflect-ambience-io-parity.test.ts` ↔
 * `pause-reflect-generation-io-parity.test.ts`, `pause-reflect-mood-io-parity.test.ts`,
 * `pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-ambience-io ↔ pause-reflect-generation-io sibling parity (application)', () => {
  it('ambience-io and generation-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect('runReflectGeneration' in ambienceIo).toBe(false);
    expect('pauseReflectGeneration' in ambienceIo).toBe(false);
    expect('reflectGenerationPrerequisite' in ambienceIo).toBe(false);
    expect('reflectGenerator' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in generationIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in generationIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off holzen-reflect generation', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(reflectGenerationPrerequisite);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(messageFromReflectGenerationResult);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(shouldCommitReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(reflectGenerator);
  });

  it('holzen-reflect generation I/O keeps edge generation off frame-focus ambience bed', () => {
    expect(runReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectGenerationPrerequisite).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(messageFromReflectGenerationResult).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(resolveReflectGenerationPrefetch).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldCommitReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectGenerator).not.toBe(startPauseReflectFrameFocusAmbience);
  });
});
