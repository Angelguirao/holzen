import { describe, expect, it, vi } from 'vitest';
import { runReflectGeneration } from './run-reflect-generation';
import type { ReflectGenerationProfileInput } from '@/features/pause/domain/reflect/generation/reflect-generation-edge-params';

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

const emptyRecencyHints = { moodHistory: [], recentMessages: [], recentHaikus: [] };

const noopReflectPortExtras = {
  fetchHaikuText: vi.fn(),
  fetchLatestReflectStep: vi.fn(),
  loadRecencyHints: vi.fn().mockResolvedValue(emptyRecencyHints),
};

describe('runReflectGeneration', () => {
  it('returns seed without calling ports', async () => {
    const fetchReflectionText = vi.fn();
    const generateReflection = vi.fn();

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '  seeded  ' },
      { fetchReflectionText, generateReflection, ...noopReflectPortExtras },
    );

    expect(result).toEqual({ status: 'seed', message: 'seeded' });
    expect(fetchReflectionText).not.toHaveBeenCalled();
    expect(generateReflection).not.toHaveBeenCalled();
  });

  it('returns cached artifact message', async () => {
    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        fetchReflectionText: vi.fn().mockResolvedValue('from cache'),
        generateReflection: vi.fn(),
        ...noopReflectPortExtras,
      },
    );

    expect(result).toEqual({ status: 'cached', message: 'from cache' });
  });

  it('invokes holzen-reflect when cache empty', async () => {
    const loadRecencyHints = vi.fn().mockResolvedValue(emptyRecencyHints);
    const generateReflection = vi.fn().mockResolvedValue({ message: 'fresh' });

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        ...noopReflectPortExtras,
        fetchReflectionText: vi.fn().mockResolvedValue(null),
        loadRecencyHints,
        generateReflection,
      },
    );

    expect(result).toEqual({ status: 'generated', message: 'fresh' });
    expect(loadRecencyHints).toHaveBeenCalledTimes(1);
    expect(generateReflection).toHaveBeenCalledWith(
      expect.objectContaining({
        pauseInstanceId: 'pi-1',
        userId: 'user-1',
        context: 'btc dip',
      }),
      emptyRecencyHints,
    );
  });

  it('aborts without rethrowing', async () => {
    const ac = new AbortController();
    ac.abort();

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '', signal: ac.signal },
      {
        fetchReflectionText: vi.fn().mockResolvedValue(null),
        generateReflection: vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
        ...noopReflectPortExtras,
      },
    );

    expect(result).toEqual({ status: 'aborted' });
  });
});
