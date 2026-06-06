import { describe, expect, it } from 'vitest';
import type { MarketQuote } from '@/features/market/public';
import {
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from './pause-session-reflect-and-decide-flow';

describe('pause-session-reflect-and-decide-flow', () => {
  it('preflight enables holzen-reflect on deep reflect step', () => {
    const marketData = { changePercent: -2.5 } as MarketQuote;
    const view = resolvePauseSessionReflectAndDecidePreflight({
      ritualEntry: 'deep',
      step: 'reflect',
      seedMessage: 'Seed',
      marketData,
    });
    expect(view.reflectGenEnabled).toBe(true);
    expect(view.severityAbsPct).toBe(2.5);
    expect(view.effectiveReflectionMessage).toBe('Seed');
  });

  it('after generation resolves effective copy from holzen-reflect output', () => {
    const view = resolvePauseSessionReflectAndDecideAfterGeneration({
      ritualEntry: 'deep',
      step: 'reflect',
      seedMessage: 'Seed',
      generatedReflectionMessage: '  Generated  ',
      marketData: null,
    });
    expect(view.effectiveReflectionMessage).toBe('Generated');
  });

  it('preflight disables generation for brief ritual', () => {
    const view = resolvePauseSessionReflectAndDecidePreflight({
      ritualEntry: 'brief',
      step: 'reflect',
      seedMessage: 'Only seed',
      marketData: null,
    });
    expect(view.reflectGenEnabled).toBe(false);
    expect(view.effectiveReflectionMessage).toBe('Only seed');
  });
});
