import { describe, expect, it } from 'vitest';
import type { BtcPriceData } from '@/features/market/public';
import { buildPauseSessionReflectAndDecideView } from './pause-session-reflect-and-decide-view';

describe('buildPauseSessionReflectAndDecideView', () => {
  it('enables holzen-reflect on deep reflect step and resolves effective copy', () => {
    const btcData = { changePercent: -2.5 } as BtcPriceData;
    const view = buildPauseSessionReflectAndDecideView({
      ritualEntry: 'deep',
      step: 'reflect',
      seedMessage: 'Seed',
      generatedReflectionMessage: '  Generated  ',
      btcData,
    });
    expect(view.reflectGenEnabled).toBe(true);
    expect(view.severityAbsPct).toBe(2.5);
    expect(view.effectiveReflectionMessage).toBe('Generated');
  });

  it('disables generation for brief ritual', () => {
    const view = buildPauseSessionReflectAndDecideView({
      ritualEntry: 'brief',
      step: 'reflect',
      seedMessage: 'Only seed',
      generatedReflectionMessage: '',
      btcData: null,
    });
    expect(view.reflectGenEnabled).toBe(false);
    expect(view.effectiveReflectionMessage).toBe('Only seed');
  });
});
