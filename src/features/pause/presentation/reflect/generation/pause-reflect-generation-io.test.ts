import { describe, expect, it, vi } from 'vitest';
import { runReflectGeneration as runReflectGenerationDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import { pauseReflectionShareImage } from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectTagUpdate,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import { pauseReflectGeneration, reflectGenerator } from './pause-reflect-generation-io';

const runReflectGenerationMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation',
  () => ({
    runReflectGeneration: runReflectGenerationMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

describe('pause-reflect-generation-io', () => {
  it('exports holzen-reflect RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(pauseReflectGeneration).not.toBe(runReflectGenerationDirect);
  });

  it('delegates to runReflectGeneration with default reflectGenerator port', async () => {
    runReflectGenerationMock.mockResolvedValue({ status: 'generated', message: 'ok' });

    const input = {
      pauseInstanceId: 'pause-1',
      userId: 'user-1',
      context: 'btc',
      initialReflectionMessage: '',
      severityAbsPct: 50,
      profile: { display_name: 'Test' },
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input);

    expect(runReflectGenerationMock).toHaveBeenCalledWith(input, reflectGenerator);
  });

  it('accepts an injected ReflectGenerator', async () => {
    const customGenerator = { port: 'custom' } as typeof reflectGenerator;
    runReflectGenerationMock.mockResolvedValue({ status: 'cached', message: 'cached' });

    const input = {
      pauseInstanceId: 'pause-2',
      userId: 'user-2',
      context: 'eth',
      initialReflectionMessage: 'seed',
      severityAbsPct: 10,
      profile: {},
      signal: new AbortController().signal,
    };

    await pauseReflectGeneration(input, customGenerator);

    expect(runReflectGenerationMock).toHaveBeenCalledWith(input, customGenerator);
  });

  it('sibling cluster: generation-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(pauseReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(reflectGenerator).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectGenerator).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Full cross-I/O pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: share-io exports stay distinct from generation-io holzen-reflect surface', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectionShareImage);
    expect(reflectGenerator).not.toBe(pauseReflectionShareImage);
    // Full cross-I/O pins: `pause-reflect-generation-share-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: steps-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseReflectGeneration).not.toBe(pauseReflectNoteUpdate);
    expect(pauseReflectGeneration).not.toBe(pauseReflectTagUpdate);
    expect(pauseReflectGeneration).not.toBe(pauseReflectionStepLogOnce);
    expect(reflectGenerator).not.toBe(reflectPauseRepository);
    // Full cross-I/O pins: `pause-reflect-steps-generation-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: session reflect telemetry-io exports stay distinct from generation-io', () => {
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(reflectGenerator).not.toBe(trackPauseReflectPostItOpen);
    // Full cross-I/O pins: `pause-reflect-generation-telemetry-io-sibling-parity.test.ts`.
  });
});
