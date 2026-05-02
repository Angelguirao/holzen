import { describe, expect, it } from 'vitest';
import {
  computeBlockInsertRank,
  mergeOrderWithDefaults,
  normalizeHomeSectionOrder,
} from './home-section-order-normalize';
import { ALL_HOME_SECTION_IDS } from '@/hooks/use-home-optional-visibility';
import { buildHomeRenderableSegments } from './home-renderable-segments';

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
  it('defaults to canonical wireframe order', () => {
    expect(normalizeHomeSectionOrder([], DEFAULT)).toEqual(DEFAULT);
  });

  it('places goal-why immediately before market and your-pause when journey was between', () => {
    const broken = ['night', 'market', 'journey-pulse', 'your-pause', 'goal-why', 'quick-capture'];
    const out = normalizeHomeSectionOrder(broken, DEFAULT);
    expect(out).toEqual([
      'night',
      'goal-why',
      'market',
      'your-pause',
      'journey-pulse',
      'quick-capture',
    ]);
    const today = buildHomeRenderableSegments(out).find((s) => s.type === 'todayBlock');
    expect(today).toEqual({ type: 'todayBlock', ids: ['market', 'your-pause'] });
  });

  it('is idempotent', () => {
    const once = normalizeHomeSectionOrder(
      ['journey-pulse', 'night', 'goal-why', 'market', 'your-pause', 'quick-capture'],
      DEFAULT,
    );
    expect(normalizeHomeSectionOrder(once, DEFAULT)).toEqual(once);
  });

  it('preserves movable relative order while fixing anchors', () => {
    const out = normalizeHomeSectionOrder(
      ['journey-pulse', 'night', 'quick-capture', 'goal-why', 'market', 'your-pause'],
      DEFAULT,
    );
    expect(out).toEqual([
      'journey-pulse',
      'night',
      'quick-capture',
      'goal-why',
      'market',
      'your-pause',
    ]);
  });
});

describe('computeBlockInsertRank', () => {
  it('counts movables before the earliest anchor', () => {
    expect(computeBlockInsertRank(DEFAULT)).toBe(1);
  });
});
