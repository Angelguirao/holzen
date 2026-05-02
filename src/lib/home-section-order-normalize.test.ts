import { describe, expect, it } from 'vitest';
import {
  mergeOrderWithDefaults,
  normalizeHomeSectionOrder,
  normalizeTailMarketPauseAdjacent,
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

describe('normalizeTailMarketPauseAdjacent', () => {
  it('moves ids between market and your-pause to after the pair', () => {
    expect(normalizeTailMarketPauseAdjacent(['night', 'market', 'journey-pulse', 'your-pause', 'quick-capture'])).toEqual([
      'night',
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

  it('prepends goal-why and pulls sections between market and your-pause after the pair', () => {
    const broken = ['night', 'market', 'journey-pulse', 'your-pause', 'goal-why', 'quick-capture'];
    const out = normalizeHomeSectionOrder(broken, DEFAULT);
    expect(out).toEqual([
      'goal-why',
      'night',
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

  it('preserves tail relative order when market and your-pause stay adjacent', () => {
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