import { describe, expect, it } from 'vitest';
import {
  buildReflectGenerationEdgeInvokeInput,
  type ReflectGenerationProfileInput,
} from './reflect-generation-edge-params';

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

describe('buildReflectGenerationEdgeInvokeInput', () => {
  it('maps profile fields and severity to edge invoke body', () => {
    const ac = new AbortController();
    const result = buildReflectGenerationEdgeInvokeInput({
      pauseInstanceId: 'pi-1',
      userId: 'user-1',
      context: '  btc dip  ',
      severityAbsPct: 42,
      profile,
      signal: ac.signal,
    });

    expect(result).toEqual({
      pauseInstanceId: 'pi-1',
      userId: 'user-1',
      context: '  btc dip  ',
      severity: 42,
      tone: 'calm',
      style: 'brief',
      currency: 'USD',
      language: 'en',
      signal: ac.signal,
    });
    expect(result.customPrompt).toBeUndefined();
    expect(result.motivations).toBeUndefined();
    expect(result.mantra).toBeUndefined();
    expect(result.groundingActivities).toBeUndefined();
  });

  it('includes optional profile fields when non-empty', () => {
    const result = buildReflectGenerationEdgeInvokeInput({
      pauseInstanceId: 'pi-2',
      userId: 'user-2',
      context: 'context',
      severityAbsPct: 1,
      profile: {
        ...profile,
        customPrompt: 'focus on breath',
        motivations: ['calm'],
        mantra: 'breathe',
        groundingActivities: ['walk'],
      },
    });

    expect(result).toMatchObject({
      customPrompt: 'focus on breath',
      motivations: ['calm'],
      mantra: 'breathe',
      groundingActivities: ['walk'],
    });
  });
});
