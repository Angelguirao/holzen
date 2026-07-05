import { forwardRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useProGate } from '@/features/subscription/public-hooks';
import { useCompanionSection, useCompanionSectionExpansion } from '@/features/pause/public-ritual-frame';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public-ritual-frame';
import { CompanionSectionHaikuSlot } from '@/screens/pause/components/companion/companion-section-haiku-slot';
import { CompanionSectionOrchestratedSlots } from '@/screens/pause/components/companion/companion-section-orchestrated-slots';
import { companionSectionProFavoriteProps } from '@/features/pause/public-ritual-frame';
import type { CompanionCardAppearance } from '@/screens/pause/components/companion/companion-card';
import type { CompanionSectionOrchestratedSlotsProps } from '@/screens/pause/components/companion/companion-section-orchestrated-slots';

interface Props {
  companions: CompanionData;
  prefs: CompanionPrefs;
  severity?: 'mild' | 'moderate' | 'high';
  pauseInstanceId?: string | null;
  context?: string | null;
  reflectionMessage?: string | null;
  /** Current user mood — drives intervention selection */
  mood?: string | null;
  /** Overrides the small section label above companion cards (e.g. pause reflect step). */
  sectionLead?: string | null;
  hideSectionLead?: boolean;
  exclusiveExpand?: boolean;
  appearance?: CompanionCardAppearance;
  companionSlotOrder?: CompanionSectionOrchestratedSlotsProps['companionSlotOrder'];
}

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection(
  {
    companions,
    prefs,
    severity = 'mild',
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    sectionLead,
    hideSectionLead = false,
    exclusiveExpand = false,
    appearance = 'default',
    companionSlotOrder = 'default',
  },
  ref,
) {
  "use memo";
  const { t } = useTranslation();
  const { isPro } = useProGate();

  const frameIconHelps = useMemo(
    () =>
      appearance === 'frame'
        ? {
            haiku: t('pause.frame.companions.haikuHelp'),
            signal: t('pause.frame.companions.signalHelp'),
            grounding: t('pause.frame.companions.groundingHelp'),
            zoomOut: t('pause.frame.companions.zoomOutHelp'),
            lookBack: t('pause.frame.companions.lookBackHelp'),
          }
        : undefined,
    [appearance, t],
  );

  const {
    labels,
    visibility: { hasHaiku, hasSignal, hasGrounding, hasZoomOut, hasHistory },
    showSection,
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    grounding,
    groundingLoading,
    groundingError,
    retryGrounding,
    signal,
    signalLoading,
    signalError,
    retrySignal,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    retryZoomOut,
    historyInsight,
    historyLoading,
    historyError,
    retryHistory,
    cacheIds,
    cacheRelaxations,
    regenerateCompanion,
    canAccessCompanion,
    fetchCompanion,
  } = useCompanionSection({
    companions,
    prefs,
    severity,
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
  });

  const {
    expandedHaiku,
    expandedLearning,
    expandedSignal,
    expandedZoomOut,
    expandedHistory,
    toggleHaiku,
    toggleSignal,
    toggleGrounding,
    toggleZoomOut,
    toggleHistory,
  } = useCompanionSectionExpansion({
    signal,
    signalLoading,
    signalError,
    grounding,
    groundingLoading,
    groundingError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    historyInsight,
    historyLoading,
    historyError,
    fetchCompanion,
    canAccessCompanion,
    exclusiveExpand,
  });

  const proFavorite = useCallback(
    (favoriteKey: string) =>
      companionSectionProFavoriteProps(isPro, favorites, favoriteKey, toggleCompanionFavorite),
    [isPro, favorites, toggleCompanionFavorite],
  );

  if (!showSection) return null;

  return (
    <div ref={ref} className="space-y-3">
      {hideSectionLead ? null : (
        <p className="mb-2 px-1 text-center text-xs font-medium leading-snug text-muted-foreground">
          {sectionLead ?? labels.pause}
        </p>
      )}

      {hasHaiku && companions.haiku ? (
        <CompanionSectionHaikuSlot
          haiku={companions.haiku}
          label={labels.haiku}
          expanded={expandedHaiku}
          onToggleExpand={toggleHaiku}
          completed={Boolean(completion.haiku)}
          onFirstExpandComplete={() => markCompleted('haiku')}
          proFavorite={proFavorite('haiku')}
          appearance={appearance}
          iconHelp={frameIconHelps?.haiku}
        />
      ) : null}

      <CompanionSectionOrchestratedSlots
        labels={labels}
        visibility={{ hasSignal, hasGrounding, hasZoomOut, hasHistory }}
        pauseInstanceId={pauseInstanceId}
        completion={completion}
        markCompleted={markCompleted}
        expandedSignal={expandedSignal}
        expandedLearning={expandedLearning}
        expandedZoomOut={expandedZoomOut}
        expandedHistory={expandedHistory}
        toggleSignal={toggleSignal}
        toggleGrounding={toggleGrounding}
        toggleZoomOut={toggleZoomOut}
        toggleHistory={toggleHistory}
        signal={signal}
        signalLoading={signalLoading}
        signalError={signalError}
        retrySignal={retrySignal}
        grounding={grounding}
        groundingLoading={groundingLoading}
        groundingError={groundingError}
        retryGrounding={retryGrounding}
        zoomOut={zoomOut}
        zoomOutLoading={zoomOutLoading}
        zoomOutError={zoomOutError}
        retryZoomOut={retryZoomOut}
        historyInsight={historyInsight}
        historyLoading={historyLoading}
        historyError={historyError}
        retryHistory={retryHistory}
        cacheIds={cacheIds}
        cacheRelaxations={cacheRelaxations}
        regenerateCompanion={regenerateCompanion}
        proFavorite={proFavorite}
        appearance={appearance}
        companionSlotOrder={companionSlotOrder}
        iconHelps={frameIconHelps}
      />
    </div>
  );
});
