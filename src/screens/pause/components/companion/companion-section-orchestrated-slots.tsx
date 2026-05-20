import type {
  CachedHistoricalInsightShape,
  CompanionData,
  CompanionSlotCacheIds,
  CompanionSlotRelaxations,
  RegenerateCompanionSlot,
  ZoomOutData,
} from '@/features/pause/public';
import type {
  CompanionUiCompletionState,
  CompanionUiCompletionStep,
} from '@/features/pause/public-queries';

type CompanionSignalPayload = {
  title: string;
  body: string;
  source: string;
  url: string;
} | null;

type CompanionNudgePayload = {
  title: string;
  body: string;
  citation: string;
  url: string;
} | null;
import { LearningInput } from '@/screens/pause/components/LearningInput';
import { SignalDisplay } from '@/screens/pause/components/SignalDisplay';
import { ZoomOutDisplay } from '@/screens/pause/components/ZoomOutDisplay';
import { HistoricalInsightDisplay } from '@/screens/pause/components/HistoricalInsightDisplay';
import { CompanionOrchestratedCard } from '@/screens/pause/components/companion/companion-orchestrated-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import type { CompanionSectionProFavoriteProps } from '@/screens/pause/lib/companion-section-pro-favorite';

export type CompanionSectionOrchestratedSlotsProps = {
  labels: {
    signal: string;
    ground: string;
    zoomOut: string;
    lookBack: string;
  };
  visibility: {
    hasSignal: boolean;
    hasGrounding: boolean;
    hasZoomOut: boolean;
    hasHistory: boolean;
  };
  companions: CompanionData;
  pauseInstanceId?: string | null;
  completion: CompanionUiCompletionState;
  markCompleted: (key: CompanionUiCompletionStep) => void | Promise<void>;
  expandedSignal: boolean;
  expandedLearning: boolean;
  expandedZoomOut: boolean;
  expandedHistory: boolean;
  toggleSignal: () => void;
  toggleGrounding: () => void;
  toggleZoomOut: () => void;
  toggleHistory: () => void;
  signal: CompanionSignalPayload;
  signalLoading: boolean;
  signalError: boolean;
  retrySignal: () => void;
  nudge: CompanionNudgePayload;
  nudgeLoading: boolean;
  nudgeError: boolean;
  retryNudge: () => void;
  zoomOut: ZoomOutData | null;
  zoomOutLoading: boolean;
  zoomOutError: boolean;
  retryZoomOut: () => void;
  historyInsight: CachedHistoricalInsightShape | null;
  historyLoading: boolean;
  historyError: boolean;
  retryHistory: () => void;
  cacheIds: CompanionSlotCacheIds;
  cacheRelaxations: CompanionSlotRelaxations;
  regenerateCompanion: (slot: RegenerateCompanionSlot) => void;
  proFavorite: (favoriteKey: string) => CompanionSectionProFavoriteProps;
};

export function CompanionSectionOrchestratedSlots({
  labels,
  visibility,
  companions,
  pauseInstanceId,
  completion,
  markCompleted,
  expandedSignal,
  expandedLearning,
  expandedZoomOut,
  expandedHistory,
  toggleSignal,
  toggleGrounding,
  toggleZoomOut,
  toggleHistory,
  signal,
  signalLoading,
  signalError,
  retrySignal,
  nudge,
  nudgeLoading,
  nudgeError,
  retryNudge,
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
  proFavorite,
}: CompanionSectionOrchestratedSlotsProps) {
  const { hasSignal, hasGrounding, hasZoomOut, hasHistory } = visibility;

  return (
    <>
      {hasSignal ? (
        <CompanionOrchestratedCard
          id="signal"
          label={labels.signal}
          icon={COMPANION_SECTION_ICONS.signal}
          expanded={expandedSignal}
          onToggleExpand={toggleSignal}
          completed={Boolean(completion.signal)}
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
          completed={Boolean(completion.grounding)}
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
          completed={Boolean(completion.zoomOut)}
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
          completed={Boolean(completion.history)}
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
    </>
  );
}
