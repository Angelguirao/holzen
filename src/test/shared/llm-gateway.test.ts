import { describe, expect, it } from 'vitest';
import {
  budgetTierFromSpendRatio,
  resolveModelsForTask,
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
