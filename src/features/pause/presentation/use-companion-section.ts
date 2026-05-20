import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import type { PauseSeverity } from '@/features/pause/application/use-cases/session/location-state';
import { pauseSeverityToOrchestrateNumber } from '@/features/pause/application/use-cases/companion/full-view-page-helpers';
import {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from '@/features/pause/application/use-cases/companion/section-visibility';
import { useCompanionData } from './use-companion-data';

export type UseCompanionSectionParams = {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: PauseSeverity;
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  mood?: string | null;
};

/** Inline companion strip on pause ritual steps — data + i18n labels + visibility flags. */
export function useCompanionSection({
  companions,
  prefs,
  severity = 'mild',
  pauseInstanceId,
  context,
  reflectionMessage,
  mood,
}: UseCompanionSectionParams) {
  const { t } = useTranslation();

  const companion = useCompanionData({
    companions,
    prefs,
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber: pauseSeverityToOrchestrateNumber(severity),
  });

  const labels = useMemo(
    () => ({
      pause: t('companions.pause'),
      breathe: t('companions.breathe'),
      haiku: t('companions.haiku'),
      ground: t('companions.ground'),
      signal: t('companions.signal'),
      zoomOut: t('companions.zoomOut'),
      lookBack: t('companions.lookBack'),
    }),
    [t],
  );

  const visibility = useMemo(
    () => getCompanionSectionVisibility(prefs, companions, pauseInstanceId),
    [prefs, companions, pauseInstanceId],
  );

  const showSection = useMemo(() => isCompanionSectionVisible(visibility), [visibility]);

  return {
    labels,
    visibility,
    showSection,
    ...companion,
  };
}
