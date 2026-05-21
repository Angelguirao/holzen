import { describe, expect, it, vi } from 'vitest';
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
}));

describe('pause-reflect-generation-io', () => {
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
});
