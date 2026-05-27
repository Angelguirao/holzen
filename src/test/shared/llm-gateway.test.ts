import { describe, expect, it } from 'vitest';
import {
  budgetTierFromSpendRatio,
  parseLlmProviderOrder,
  rewrapDrainedLlmResponse,
  resolveModelsForTask,
  shouldUseCuratedFallbackForGoogleDegradation,
} from '../../../supabase/functions/_shared/llm-gateway.ts';

describe('llm-gateway task profiles', () => {
  it('downgrades reflect models in economy tier', () => {
    const normal = resolveModelsForTask('reflect', 'normal');
    const economy = resolveModelsForTask('reflect', 'economy');
    expect(normal[0]).toContain('gemini-3');
    expect(economy.every((m) => !m.includes('gemini-3'))).toBe(true);
  });

  it('uses flash-lite only in critical tier for structure', () => {
    const critical = resolveModelsForTask('structure', 'critical');
    expect(critical).toEqual(['google/gemini-2.5-flash-lite']);
  });
});

describe('llm-budget tier thresholds', () => {
  it('returns economy at 70% and critical at 90%', () => {
    expect(budgetTierFromSpendRatio(0.69)).toBe('normal');
    expect(budgetTierFromSpendRatio(0.7)).toBe('economy');
    expect(budgetTierFromSpendRatio(0.89)).toBe('economy');
    expect(budgetTierFromSpendRatio(0.9)).toBe('critical');
  });
});

describe('parseLlmProviderOrder', () => {
  it('defaults to openrouter only', () => {
    expect(parseLlmProviderOrder(undefined)).toEqual(['openrouter']);
  });

  it('honors openrouter-first order', () => {
    expect(parseLlmProviderOrder('openrouter,google')).toEqual(['openrouter', 'google']);
  });

  it('dedupes invalid entries', () => {
    expect(parseLlmProviderOrder('openrouter,openrouter,anthropic,google')).toEqual([
      'openrouter',
      'google',
    ]);
  });
});

describe('shouldUseCuratedFallbackForGoogleDegradation', () => {
  it('requires curated pool when google is degraded and openrouter is missing', () => {
    expect(
      shouldUseCuratedFallbackForGoogleDegradation(true, [
        { provider: 'google', apiKey: 'g' },
      ]),
    ).toBe(true);
  });

  it('allows live generation when openrouter is configured', () => {
    expect(
      shouldUseCuratedFallbackForGoogleDegradation(true, [
        { provider: 'openrouter', apiKey: 'o' },
      ]),
    ).toBe(false);
  });
});

describe('rewrapDrainedLlmResponse', () => {
  it('returns a response whose body callers can read after draining for failover', async () => {
    const rewrapped = await rewrapDrainedLlmResponse(
      new Response('provider error', { status: 503 }),
    );
    expect(rewrapped.status).toBe(503);
    await expect(rewrapped.text()).resolves.toBe('provider error');
  });
});
