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
import { CompanionOrchestratedSlotChrome } from '@/screens/pause/components/companion/companion-orchestrated-slot-chrome';
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
        <CompanionCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_SECTION_ICONS.signal}
          expanded={expandedSignal}
          onToggle={() => {
            toggleSignal();
            if (!completion.signal) markCompleted('signal');
          }}
          completed={completion.signal}
          loading={signalLoading}
          {...proFavorite('signal')}
        >
          <CompanionOrchestratedSlotChrome
            pauseInstanceId={pauseInstanceId}
            hasContent={Boolean(signal)}
            loading={signalLoading}
            relaxationKey={cacheRelaxations.signal}
            companionType="signal"
            cacheId={cacheIds.signal}
            regenerateSlot="signal"
            onRegenerate={() => regenerateCompanion('signal')}
            regenerating={signalLoading}
            routeSegment="signal"
          >
            <SignalDisplay signal={signal} loading={signalLoading} error={signalError} onRetry={retrySignal} />
          </CompanionOrchestratedSlotChrome>
        </CompanionCard>
      ) : null}

      {hasGrounding ? (
        <CompanionCard
          id="grounding"
          label={labels.ground}
          icon={COMPANION_SECTION_ICONS.grounding}
          expanded={expandedLearning}
          onToggle={() => {
            toggleGrounding();
            if (!completion.grounding) markCompleted('grounding');
          }}
          completed={completion.grounding}
          loading={nudgeLoading}
          {...proFavorite('grounding')}
        >
          <CompanionOrchestratedSlotChrome
            pauseInstanceId={pauseInstanceId}
            hasContent={Boolean(nudge)}
            loading={nudgeLoading}
            relaxationKey={cacheRelaxations.nudge}
            companionType="grounding"
            cacheId={cacheIds.nudge}
            regenerateSlot="grounding"
            onRegenerate={() => regenerateCompanion('grounding')}
            regenerating={nudgeLoading}
            routeSegment="grounding"
          >
            <LearningInput
              title={companions.groundingTitle ?? ''}
              body={companions.groundingBody ?? ''}
              nudge={nudge}
              nudgeLoading={nudgeLoading}
              nudgeError={nudgeError}
              onRetry={retryNudge}
            />
          </CompanionOrchestratedSlotChrome>
        </CompanionCard>
      ) : null}

      {hasZoomOut ? (
        <CompanionCard
          id="zoomOut"
          label={labels.zoomOut}
          icon={COMPANION_SECTION_ICONS.zoomOut}
          expanded={expandedZoomOut}
          onToggle={() => {
            toggleZoomOut();
            if (!completion.zoomOut) markCompleted('zoomOut');
          }}
          completed={completion.zoomOut}
          loading={zoomOutLoading}
          {...proFavorite('zoom_out')}
        >
          <CompanionOrchestratedSlotChrome
            pauseInstanceId={pauseInstanceId}
            hasContent={Boolean(zoomOut)}
            loading={zoomOutLoading}
            relaxationKey={cacheRelaxations.zoomOut}
            companionType="zoom_out"
            cacheId={cacheIds.zoomOut}
            regenerateSlot="zoomOut"
            onRegenerate={() => regenerateCompanion('zoomOut')}
            regenerating={zoomOutLoading}
            routeSegment="zoom-out"
          >
            <ZoomOutDisplay data={zoomOut} loading={zoomOutLoading} error={zoomOutError} onRetry={retryZoomOut} />
          </CompanionOrchestratedSlotChrome>
        </CompanionCard>
      ) : null}

      {hasHistory ? (
        <CompanionCard
          id="history"
          label={labels.lookBack}
          icon={COMPANION_SECTION_ICONS.history}
          expanded={expandedHistory}
          onToggle={() => {
            toggleHistory();
            if (!completion.history) markCompleted('history');
          }}
          completed={completion.history}
          loading={historyLoading}
          {...proFavorite('history_insight')}
        >
          <CompanionOrchestratedSlotChrome
            pauseInstanceId={pauseInstanceId}
            hasContent={Boolean(historyInsight)}
            loading={historyLoading}
            relaxationKey={cacheRelaxations.history}
            companionType="history_insight"
            cacheId={cacheIds.history}
            regenerateSlot="history"
            onRegenerate={() => regenerateCompanion('history')}
            regenerating={historyLoading}
            routeSegment="history"
          >
            <HistoricalInsightDisplay
              data={historyInsight}
              loading={historyLoading}
              error={historyError}
              onRetry={retryHistory}
            />
          </CompanionOrchestratedSlotChrome>
        </CompanionCard>
      ) : null}
    </div>
  );
});
