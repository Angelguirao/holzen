import { describe, expect, it } from 'vitest';
import {
  computeShowJourneyStatTiles,
  computeTodaySectionIds,
  computeVisibleOrderedSectionIds,
} from './compute-home-visible-sections';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from './home-section-visibility-constants';

describe('computeVisibleOrderedSectionIds', () => {
  it('keeps always-visible sections regardless of sectionVisible', () => {
    const ids = computeVisibleOrderedSectionIds({
      order: ['your-pause', 'market', 'goal-why'],
      sectionVisible: { 'your-pause': false, market: false },
    });
    expect(ids).toEqual(['your-pause', 'market', 'goal-why']);
  });

  it('drops optional widgets when toggled off', () => {
    const ids = computeVisibleOrderedSectionIds({
      order: ['your-pause', JOURNEY_STAT_TILES_VISIBILITY_ID, 'market'],
      sectionVisible: { [JOURNEY_STAT_TILES_VISIBILITY_ID]: false },
    });
    expect(ids).toEqual(['your-pause', 'market']);
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
