import { describe, expect, it } from 'vitest';
import {
  computeShowJourneyStatTiles,
  computeTodaySectionIds,
  computeVisibleOrderedSectionIds,
} from './compute-home-visible-sections';

describe('computeVisibleOrderedSectionIds', () => {
  it('keeps always-visible sections regardless of sectionVisible', () => {
    const ids = computeVisibleOrderedSectionIds({
      order: ['your-pause', 'market', 'goal-why'],
      sectionVisible: { 'your-pause': false, market: false },
      subscribed: true,
      hasNightReflection: true,
    });
    expect(ids).toEqual(['your-pause', 'market', 'goal-why']);
  });

  it('drops optional widgets when toggled off', () => {
    const ids = computeVisibleOrderedSectionIds({
      order: ['your-pause', 'quick-capture', 'market'],
      sectionVisible: { 'quick-capture': false },
      subscribed: true,
      hasNightReflection: true,
    });
    expect(ids).toEqual(['your-pause', 'market']);
  });

  it('hides night when unsubscribed or no night reflection', () => {
    expect(
      computeVisibleOrderedSectionIds({
        order: ['night'],
        sectionVisible: { night: true },
        subscribed: false,
        hasNightReflection: true,
      }),
    ).toEqual([]);
    expect(
      computeVisibleOrderedSectionIds({
        order: ['night'],
        sectionVisible: { night: true },
        subscribed: true,
        hasNightReflection: false,
      }),
    ).toEqual([]);
  });
});

describe('computeTodaySectionIds', () => {
  it('excludes goal-why from today strip', () => {
    expect(computeTodaySectionIds(['pause', 'goal-why', 'market'])).toEqual(['pause', 'market']);
  });
});

describe('computeShowJourneyStatTiles', () => {
  it('reflects journey stat tiles visibility flag', () => {
    expect(computeShowJourneyStatTiles({ 'journey-pulse': true })).toBe(true);
    expect(computeShowJourneyStatTiles({ 'journey-pulse': false })).toBe(false);
  });
});
