import type { TFunction } from 'i18next';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from '@/screens/home/lib/home-section-visibility-constants';

/** Customize sheet section titles (layout widget ids). */
export function getHomeCustomizeSectionTitle(t: TFunction, id: string): string {
  const titles: Record<string, string> = {
    'goal-why': t('home.customizeSheet.sections.goalWhy.title'),
    market: t('home.customizeSheet.sections.market.title'),
    'your-pause': t('home.customizeSheet.sections.yourPause.title'),
    [JOURNEY_STAT_TILES_VISIBILITY_ID]: t('home.customizeSheet.sections.journeyPulse.title'),
  };
  return titles[id] ?? id;
}

/** Customize sheet section descriptions. */
export function getHomeCustomizeSectionDescription(t: TFunction, id: string): string {
  const descs: Record<string, string> = {
    'goal-why': t('home.customizeSheet.sections.goalWhy.desc'),
    market: t('home.customizeSheet.sections.market.desc'),
    'your-pause': t('home.customizeSheet.sections.yourPause.desc'),
    [JOURNEY_STAT_TILES_VISIBILITY_ID]: t('home.customizeSheet.sections.journeyPulse.desc'),
  };
  return descs[id] ?? '';
}
