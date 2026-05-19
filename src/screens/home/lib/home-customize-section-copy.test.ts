import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from '@/screens/home/lib/home-section-visibility-constants';
import { getHomeCustomizeSectionDescription, getHomeCustomizeSectionTitle } from '@/screens/home/lib/home-customize-section-copy';

const echoT: TFunction = ((key: string) => key) as TFunction;

describe('getHomeCustomizeSectionTitle', () => {
  it('returns i18n keys for known sections', () => {
    expect(getHomeCustomizeSectionTitle(echoT, 'market')).toBe('home.customizeSheet.sections.market.title');
    expect(getHomeCustomizeSectionTitle(echoT, JOURNEY_STAT_TILES_VISIBILITY_ID)).toBe(
      'home.customizeSheet.sections.journeyPulse.title',
    );
  });

  it('falls back to raw id for unknown widgets', () => {
    expect(getHomeCustomizeSectionTitle(echoT, 'unknown-widget')).toBe('unknown-widget');
  });
});

describe('getHomeCustomizeSectionDescription', () => {
  it('returns empty string for unknown id', () => {
    expect(getHomeCustomizeSectionDescription(echoT, 'unknown')).toBe('');
  });
});
