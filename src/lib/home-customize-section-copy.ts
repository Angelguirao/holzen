import type { TFunction } from 'i18next';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from '@/lib/home-section-visibility-constants';

/** Customize sheet section titles (layout widget ids). */
export function getHomeCustomizeSectionTitle(t: TFunction, id: string): string {
  const titles: Record<string, string> = {
    'goal-why': t('home.widget.whyHoldTitle'),
    market: t('home.customizeSheet.sections.market.title'),
    'your-pause': t('home.customizeSheet.sections.yourPause.title'),
    'quick-capture': t('home.customizeSheet.sections.quickCapture.title'),
    night: t('home.customizeSheet.sections.night.title'),
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
    'quick-capture': t('home.customizeSheet.sections.quickCapture.desc'),
    night: t('home.customizeSheet.sections.night.desc'),
    [JOURNEY_STAT_TILES_VISIBILITY_ID]: t('home.customizeSheet.sections.journeyPulse.desc'),
  };
  return descs[id] ?? '';
}
