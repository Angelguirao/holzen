import { describe, expect, it, vi } from 'vitest';
import { runReflectGeneration } from './run-reflect-generation';
import type { ReflectGenerationProfileInput } from './reflect-generation-edge-params';

const profile: ReflectGenerationProfileInput = {
  reflectionTone: 'calm',
  reflectionStyle: 'brief',
  customPrompt: '',
  motivations: [],
  mantra: '',
  groundingActivities: [],
  currency: 'USD',
  language: 'en',
};

const baseInput = {
  pauseInstanceId: 'pi-1',
  userId: 'user-1',
  context: 'btc dip',
  severityAbsPct: 3,
  profile,
  signal: new AbortController().signal,
};

describe('runReflectGeneration', () => {
  it('returns seed without calling ports', async () => {
    const fetchOpeningMessage = vi.fn();
    const generateReflection = vi.fn();

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '  seeded  ' },
      { fetchOpeningMessage, generateReflection },
    );

    expect(result).toEqual({ status: 'seed', message: 'seeded' });
    expect(fetchOpeningMessage).not.toHaveBeenCalled();
    expect(generateReflection).not.toHaveBeenCalled();
  });

  it('returns cached artifact message', async () => {
    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        fetchOpeningMessage: vi.fn().mockResolvedValue('from cache'),
        generateReflection: vi.fn(),
      },
    );

    expect(result).toEqual({ status: 'cached', message: 'from cache' });
  });

  it('invokes holzen-reflect when cache empty', async () => {
    const generateReflection = vi.fn().mockResolvedValue({ message: 'fresh' });

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        fetchOpeningMessage: vi.fn().mockResolvedValue(null),
        generateReflection,
      },
    );

    expect(result).toEqual({ status: 'generated', message: 'fresh' });
    expect(generateReflection).toHaveBeenCalledWith(
      expect.objectContaining({
        pauseInstanceId: 'pi-1',
        userId: 'user-1',
        context: 'btc dip',
      }),
    );
  });

  it('aborts without rethrowing', async () => {
    const ac = new AbortController();
    ac.abort();

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '', signal: ac.signal },
      {
        fetchOpeningMessage: vi.fn().mockResolvedValue(null),
        generateReflection: vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
      },
    );

    expect(result).toEqual({ status: 'aborted' });
  });
});
