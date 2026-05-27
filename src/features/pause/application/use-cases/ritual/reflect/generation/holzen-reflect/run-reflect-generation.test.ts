import { describe, expect, it, vi } from 'vitest';
import { reflectionContentFromLegacyMessage } from '@/features/pause/domain/reflect/generation/reflection-content-v2';
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

const noopReflectGeneratorExtras = {
  fetchReflectionText: vi.fn().mockResolvedValue(null),
  fetchReflectionContent: vi.fn().mockResolvedValue(null),
  fetchHaikuText: vi.fn(),
  fetchLatestReflectStep: vi.fn(),
  loadRecencyHints: vi.fn().mockResolvedValue(emptyRecencyHints),
  persistReflectionArtifacts: vi.fn().mockResolvedValue(undefined),
};

describe('runReflectGeneration', () => {
  it('returns seed without calling generator', async () => {
    const fetchReflectionContent = vi.fn();
    const generateReflection = vi.fn();

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '  seeded  ' },
      { fetchReflectionContent, generateReflection, ...noopReflectGeneratorExtras },
    );

    expect(result).toEqual({
      status: 'seed',
      message: 'seeded',
      content: reflectionContentFromLegacyMessage('seeded'),
    });
    expect(fetchReflectionContent).not.toHaveBeenCalled();
    expect(generateReflection).not.toHaveBeenCalled();
  });

  it('returns cached artifact message', async () => {
    const cached = reflectionContentFromLegacyMessage('from cache');
    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        ...noopReflectGeneratorExtras,
        fetchReflectionContent: vi.fn().mockResolvedValue(cached),
        generateReflection: vi.fn(),
      },
    );

    expect(result).toEqual({ status: 'cached', message: 'from cache', content: cached });
  });

  it('invokes holzen-reflect when cache empty', async () => {
    const loadRecencyHints = vi.fn().mockResolvedValue(emptyRecencyHints);
    const content = reflectionContentFromLegacyMessage('fresh');
    const generateReflection = vi.fn().mockResolvedValue({ message: 'fresh', content });

    const result = await runReflectGeneration(
      { ...baseInput, initialReflectionMessage: '' },
      {
        ...noopReflectGeneratorExtras,
        loadRecencyHints,
        generateReflection,
      },
    );

    expect(result).toEqual({ status: 'generated', message: 'fresh', content });
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
        generateReflection: vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')),
        ...noopReflectGeneratorExtras,
      },
    );

    expect(result).toEqual({ status: 'aborted' });
  });
});
