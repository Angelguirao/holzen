import { forwardRef, useCallback } from 'react';

import { useProGate } from '@/features/subscription/public-hooks';
import { useCompanionSection, useCompanionSectionExpansion } from '@/features/pause/public-hooks';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import { CompanionSectionHaikuSlot } from '@/screens/pause/components/companion/companion-section-haiku-slot';
import { CompanionSectionOrchestratedSlots } from '@/screens/pause/components/companion/companion-section-orchestrated-slots';
import { companionSectionProFavoriteProps } from '@/screens/pause/lib/companion-section-pro-favorite';

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
}

export const CompanionSection = forwardRef<HTMLDivElement, Props>(function CompanionSection(
  { companions, prefs, severity = 'mild', pauseInstanceId, context, reflectionMessage, mood, sectionLead },
  ref,
) {
  const { isPro } = useProGate();

  const {
    labels,
    visibility: { hasHaiku, hasSignal, hasGrounding, hasZoomOut, hasHistory },
    showSection,
    favorites,
    toggleCompanionFavorite,
    completion,
    markCompleted,
    nudge,
    nudgeLoading,
    nudgeError,
    retryNudge,
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
    nudge,
    nudgeLoading,
    nudgeError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    historyInsight,
    historyLoading,
    historyError,
    fetchCompanion,
    canAccessCompanion,
  });

  const proFavorite = useCallback(
    (favoriteKey: string) =>
      companionSectionProFavoriteProps(isPro, favorites, favoriteKey, toggleCompanionFavorite),
    [isPro, favorites, toggleCompanionFavorite],
  );

  if (!showSection) return null;

  return (
    <div ref={ref} className="space-y-2.5">
      <p className="mb-2 px-1 text-center text-xs font-medium leading-snug text-muted-foreground">
        {sectionLead ?? labels.pause}
      </p>

      {hasHaiku && companions.haiku ? (
        <CompanionSectionHaikuSlot
          haiku={companions.haiku}
          label={labels.haiku}
          expanded={expandedHaiku}
          onToggleExpand={toggleHaiku}
          completed={Boolean(completion.haiku)}
          onFirstExpandComplete={() => markCompleted('haiku')}
          proFavorite={proFavorite('haiku')}
        />
      ) : null}

      <CompanionSectionOrchestratedSlots
        labels={labels}
        visibility={{ hasSignal, hasGrounding, hasZoomOut, hasHistory }}
        companions={companions}
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
        nudge={nudge}
        nudgeLoading={nudgeLoading}
        nudgeError={nudgeError}
        retryNudge={retryNudge}
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
      />
    </div>
  );
});
