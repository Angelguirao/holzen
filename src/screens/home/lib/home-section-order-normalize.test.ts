import { describe, expect, it } from 'vitest';
import { mergeOrderWithDefaults, normalizeHomeSectionOrder } from '@/screens/home/lib/home-section-order-normalize';
import { ALL_HOME_SECTION_IDS } from '@/screens/home/lib/home-section-visibility-constants';

const DEFAULT = [...ALL_HOME_SECTION_IDS];

describe('mergeOrderWithDefaults', () => {
  it('appends missing ids in default order', () => {
    expect(mergeOrderWithDefaults(['night'], DEFAULT)).toEqual([
      'night',
      'goal-why',
      'market',
      'your-pause',
      'journey-pulse',
      'quick-capture',
    ]);
  });
});

describe('normalizeHomeSectionOrder', () => {
  it('defaults to canonical order with goal-why first', () => {
    expect(normalizeHomeSectionOrder([], DEFAULT)).toEqual(DEFAULT);
  });

  it('prepends goal-why without reordering tail to pull market and your-pause together', () => {
    const broken = ['night', 'market', 'journey-pulse', 'your-pause', 'goal-why', 'quick-capture'];
    const out = normalizeHomeSectionOrder(broken, DEFAULT);
    expect(out).toEqual([
      'goal-why',
      'night',
      'market',
      'journey-pulse',
      'your-pause',
      'quick-capture',
    ]);
    expect(out.slice(1)).toEqual(['night', 'market', 'journey-pulse', 'your-pause', 'quick-capture']);
  });

  it('is idempotent', () => {
    const once = normalizeHomeSectionOrder(
      ['journey-pulse', 'night', 'goal-why', 'market', 'your-pause', 'quick-capture'],
      DEFAULT,
    );
    expect(normalizeHomeSectionOrder(once, DEFAULT)).toEqual(once);
  });

  it('preserves tail relative order when market and your-pause are not adjacent', () => {
    const out = normalizeHomeSectionOrder(
      ['journey-pulse', 'night', 'quick-capture', 'goal-why', 'market', 'your-pause'],
      DEFAULT,
    );
    expect(out).toEqual([
      'goal-why',
      'journey-pulse',
      'night',
      'quick-capture',
      'market',
      'your-pause',
    ]);
  });

  it('forces goal-why to index 0 even when persisted order had it elsewhere', () => {
    const out = normalizeHomeSectionOrder(
      ['night', 'market', 'your-pause', 'goal-why', 'journey-pulse', 'quick-capture'],
      DEFAULT,
    );
    expect(out[0]).toBe('goal-why');
    expect(out).toEqual([
      'goal-why',
      'night',
      'market',
      'your-pause',
      'journey-pulse',
      'quick-capture',
    ]);
  });
});
