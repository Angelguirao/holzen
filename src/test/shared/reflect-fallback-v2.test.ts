import { describe, expect, it } from 'vitest';
import { mapReflectionFallbackToV2 } from '../../../supabase/functions/_shared/reflection-fallback-v2.ts';
import { REFLECTION_FALLBACKS } from '../../../supabase/functions/_shared/fallbacks.ts';

describe('mapReflectionFallbackToV2', () => {
  it('uses structured seed fields when present', () => {
    const seed = REFLECTION_FALLBACKS[0];
    const v2 = mapReflectionFallbackToV2(seed, { context: 'BTC is down 5%', severity: 5, mood: 'anxious' });
    expect(v2.land).toBe(seed.land);
    expect(v2.hypothesis).toBe(seed.hypothesis);
    expect(v2.inquiry).toBe(seed.inquiry);
    expect(v2.message).toBe(seed.message);
    expect(v2.message).toContain('?');
    expect((v2.message.match(/\?/g) ?? []).length).toBe(1);
  });

  it('does not bolt on a second question when legacy message already asks one', () => {
    const v2 = mapReflectionFallbackToV2(
      { message: 'What would the version of you one year from now think about this moment?' },
      { context: 'BTC is up 3%', severity: 3, mood: 'calm' },
    );
    expect(v2.inquiry).toBe('');
    expect(v2.hypothesis.length).toBeGreaterThan(10);
    expect((v2.message.match(/\?/g) ?? []).length).toBe(1);
  });

  it('includes hypothesis on legacy message without a question', () => {
    const v2 = mapReflectionFallbackToV2(
      { message: 'The number changed. You did not.' },
      { context: 'BTC is down 8%', severity: 8, mood: 'fearful' },
    );
    expect(v2.hypothesis.length).toBeGreaterThan(10);
    expect(v2.inquiry).toContain('?');
    expect(v2.message).toContain(v2.hypothesis);
    expect(v2.message).toContain(v2.inquiry.replace(/\?$/, ''));
  });
});
