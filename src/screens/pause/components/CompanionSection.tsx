import { forwardRef } from 'react';

import { HaikuDisplay } from './HaikuDisplay';
import { LearningInput } from './LearningInput';
import { SignalDisplay } from './SignalDisplay';
import { ZoomOutDisplay } from './ZoomOutDisplay';
import { HistoricalInsightDisplay } from './HistoricalInsightDisplay';
import { useProGate } from '@/features/subscription/public-hooks';
import { useCompanionSection, useCompanionSectionExpansion } from '@/features/pause/public-hooks';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public';
import { CompanionCard } from '@/screens/pause/components/companion/companion-card';
import { CompanionOrchestratedCard } from '@/screens/pause/components/companion/companion-orchestrated-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';

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
    visibility: { hasHaiku, hasGrounding, hasSignal, hasZoomOut, hasHistory },
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

  if (!showSection) return null;

  const proFavorite = (key: string) =>
    isPro
      ? { isFavorite: favorites[key], onToggleFavorite: () => toggleCompanionFavorite(key) }
      : {};

  return (
    <div ref={ref} className="space-y-2.5">
      <p className="mb-2 px-1 text-center text-xs font-medium leading-snug text-muted-foreground">
        {sectionLead ?? labels.pause}
      </p>

      {hasHaiku ? (
        <CompanionCard
          id="haiku"
          label={labels.haiku}
          icon={COMPANION_SECTION_ICONS.haiku}
          expanded={expandedHaiku}
          onToggle={() => {
            toggleHaiku();
            if (!completion.haiku) markCompleted('haiku');
          }}
          completed={completion.haiku}
          {...proFavorite('haiku')}
        >
          <HaikuDisplay haiku={companions.haiku!} />
        </CompanionCard>
      ) : null}

      {hasSignal ? (
        <CompanionOrchestratedCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_SECTION_ICONS.signal}
          expanded={expandedSignal}
          onToggleExpand={toggleSignal}
          completed={completion.signal}
          onFirstExpandComplete={() => markCompleted('signal')}
          loading={signalLoading}
          pauseInstanceId={pauseInstanceId}
          hasContent={Boolean(signal)}
          relaxationKey={cacheRelaxations.signal}
          companionType="signal"
          cacheId={cacheIds.signal}
          regenerateSlot="signal"
          onRegenerate={() => regenerateCompanion('signal')}
          routeSegment="signal"
          {...proFavorite('signal')}
        >
          <SignalDisplay signal={signal} loading={signalLoading} error={signalError} onRetry={retrySignal} />
        </CompanionOrchestratedCard>
      ) : null}

      {hasGrounding ? (
        <CompanionOrchestratedCard
          id="grounding"
          label={labels.ground}
          icon={COMPANION_SECTION_ICONS.grounding}
          expanded={expandedLearning}
          onToggleExpand={toggleGrounding}
          completed={completion.grounding}
          onFirstExpandComplete={() => markCompleted('grounding')}
          loading={nudgeLoading}
          pauseInstanceId={pauseInstanceId}
          hasContent={Boolean(nudge)}
          relaxationKey={cacheRelaxations.nudge}
          companionType="grounding"
          cacheId={cacheIds.nudge}
          regenerateSlot="grounding"
          onRegenerate={() => regenerateCompanion('grounding')}
          routeSegment="grounding"
          {...proFavorite('grounding')}
        >
          <LearningInput
            title={companions.groundingTitle ?? ''}
            body={companions.groundingBody ?? ''}
            nudge={nudge}
            nudgeLoading={nudgeLoading}
            nudgeError={nudgeError}
            onRetry={retryNudge}
          />
        </CompanionOrchestratedCard>
      ) : null}

      {hasZoomOut ? (
        <CompanionOrchestratedCard
          id="zoomOut"
          label={labels.zoomOut}
          icon={COMPANION_SECTION_ICONS.zoomOut}
          expanded={expandedZoomOut}
          onToggleExpand={toggleZoomOut}
          completed={completion.zoomOut}
          onFirstExpandComplete={() => markCompleted('zoomOut')}
          loading={zoomOutLoading}
          pauseInstanceId={pauseInstanceId}
          hasContent={Boolean(zoomOut)}
          relaxationKey={cacheRelaxations.zoomOut}
          companionType="zoom_out"
          cacheId={cacheIds.zoomOut}
          regenerateSlot="zoomOut"
          onRegenerate={() => regenerateCompanion('zoomOut')}
          routeSegment="zoom-out"
          {...proFavorite('zoom_out')}
        >
          <ZoomOutDisplay data={zoomOut} loading={zoomOutLoading} error={zoomOutError} onRetry={retryZoomOut} />
        </CompanionOrchestratedCard>
      ) : null}

      {hasHistory ? (
        <CompanionOrchestratedCard
          id="history"
          label={labels.lookBack}
          icon={COMPANION_SECTION_ICONS.history}
          expanded={expandedHistory}
          onToggleExpand={toggleHistory}
          completed={completion.history}
          onFirstExpandComplete={() => markCompleted('history')}
          loading={historyLoading}
          pauseInstanceId={pauseInstanceId}
          hasContent={Boolean(historyInsight)}
          relaxationKey={cacheRelaxations.history}
          companionType="history_insight"
          cacheId={cacheIds.history}
          regenerateSlot="history"
          onRegenerate={() => regenerateCompanion('history')}
          routeSegment="history"
          {...proFavorite('history_insight')}
        >
          <HistoricalInsightDisplay
            data={historyInsight}
            loading={historyLoading}
            error={historyError}
            onRetry={retryHistory}
          />
        </CompanionOrchestratedCard>
      ) : null}
    </div>
  );
});
