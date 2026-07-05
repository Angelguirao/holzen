import { describe, expect, it } from 'vitest';
import { mergeOrderWithDefaults, normalizeHomeSectionOrder } from '@/screens/home/lib/home-section-order-normalize';
import { ALL_HOME_SECTION_IDS } from '@/screens/home/lib/home-section-visibility-constants';

const DEFAULT = [...ALL_HOME_SECTION_IDS];

describe('mergeOrderWithDefaults', () => {
  it('appends missing ids in default order', () => {
    expect(mergeOrderWithDefaults(['market'], DEFAULT)).toEqual([
      'market',
      'goal-why',
      'your-pause',
      'journey-pulse',
    ]);
  });

  it('drops legacy section ids from persisted order', () => {
    expect(mergeOrderWithDefaults(['night', 'quick-capture', 'market'], DEFAULT)).toEqual([
      'market',
      'goal-why',
      'your-pause',
      'journey-pulse',
    ]);
  });
});

describe('normalizeHomeSectionOrder', () => {
  it('defaults to canonical order with goal-why first', () => {
    expect(normalizeHomeSectionOrder([], DEFAULT)).toEqual(DEFAULT);
  });

  it('prepends goal-why without reordering tail', () => {
    const broken = ['market', 'journey-pulse', 'your-pause', 'goal-why'];
    const out = normalizeHomeSectionOrder(broken, DEFAULT);
    expect(out).toEqual(['goal-why', 'market', 'journey-pulse', 'your-pause']);
  });

  it('strips legacy ids while preserving active tail order', () => {
    const out = normalizeHomeSectionOrder(
      ['journey-pulse', 'night', 'quick-capture', 'goal-why', 'market', 'your-pause'],
      DEFAULT,
    );
    expect(out).toEqual(['goal-why', 'journey-pulse', 'market', 'your-pause']);
  });

  it('is idempotent', () => {
    const once = normalizeHomeSectionOrder(
      ['journey-pulse', 'goal-why', 'market', 'your-pause'],
      DEFAULT,
    );
    expect(normalizeHomeSectionOrder(once, DEFAULT)).toEqual(once);
  });

  it('preserves tail relative order when market and your-pause are not adjacent', () => {
    const out = normalizeHomeSectionOrder(
      ['journey-pulse', 'goal-why', 'market', 'your-pause'],
      DEFAULT,
    );
    expect(out).toEqual(['goal-why', 'journey-pulse', 'market', 'your-pause']);
  });

  it('forces goal-why to index 0 even when persisted order had it elsewhere', () => {
    const out = normalizeHomeSectionOrder(
      ['market', 'your-pause', 'goal-why', 'journey-pulse'],
      DEFAULT,
    );
    expect(out[0]).toBe('goal-why');
    expect(out).toEqual(['goal-why', 'market', 'your-pause', 'journey-pulse']);
  });
});
