import { useMemo, type ReactNode } from 'react';
import type {
  CachedHistoricalInsightShape,
  CompanionData,
  CompanionSlotCacheIds,
  CompanionSlotRelaxations,
  RegenerateCompanionSlot,
} from '@/features/pause/public-ritual-frame';
import type { ZoomOutData } from '@/features/pause/public-ritual-frame';
import { mergeHistoryBtcOverlay } from '@/features/pause/application/use-cases/ritual/frame/historical-insight-payload';
import type {
  CompanionUiCompletionState,
  CompanionUiCompletionStep,
} from '@/features/pause/public-queries';

import type { SignalPayload } from '@/features/pause/domain/signal-payload';

type CompanionSignalPayload = SignalPayload | null;

type CompanionNudgePayload = {
  title: string;
  body: string;
  citation: string;
  url: string;
} | null;
import { GroundingDisplay } from '@/screens/pause/components/GroundingDisplay';
import { SignalDisplay } from '@/screens/pause/components/SignalDisplay';
import { ZoomOutDisplay } from '@/screens/pause/components/ZoomOutDisplay';
import { HistoricalInsightDisplay } from '@/screens/pause/components/HistoricalInsightDisplay';
import {
  CompanionOrchestratedCard,
  type CompanionOrchestratedCardProps,
} from '@/screens/pause/components/companion/companion-orchestrated-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import type { CompanionSectionProFavoriteProps } from '@/features/pause/public-ritual-frame';

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
  appearance?: CompanionOrchestratedCardProps['appearance'];
  /** Figma Frame: Grounding → Zoom out → Look back → Signal (default: Signal first). */
  companionSlotOrder?: 'default' | 'frame';
  iconHelps?: {
    signal?: string;
    grounding?: string;
    zoomOut?: string;
    lookBack?: string;
  };
};

type OrchestratedSlotKey = 'signal' | 'grounding' | 'zoomOut' | 'history';

const DEFAULT_SLOT_ORDER: OrchestratedSlotKey[] = ['signal', 'grounding', 'zoomOut', 'history'];
const FRAME_SLOT_ORDER: OrchestratedSlotKey[] = ['grounding', 'zoomOut', 'history', 'signal'];

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
  appearance = 'default',
  companionSlotOrder = 'default',
  iconHelps,
}: CompanionSectionOrchestratedSlotsProps) {
  "use memo";
  const { hasSignal, hasGrounding, hasZoomOut, hasHistory } = visibility;
  const frameAppearance = appearance === 'frame';
  const showFullViewButton = !frameAppearance;
  const historyDisplay = useMemo(
    () => mergeHistoryBtcOverlay(historyInsight, zoomOut),
    [historyInsight, zoomOut],
  );

  const slotOrder = companionSlotOrder === 'frame' ? FRAME_SLOT_ORDER : DEFAULT_SLOT_ORDER;

  const slots: Record<OrchestratedSlotKey, ReactNode> = {
    signal: hasSignal ? (
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
          appearance={appearance}
          iconHelp={iconHelps?.signal}
          showFullViewButton={showFullViewButton}
          {...proFavorite('signal')}
        >
          <SignalDisplay
            signal={signal}
            loading={signalLoading}
            error={signalError}
            onRetry={retrySignal}
            variant={frameAppearance ? 'frame' : 'default'}
            pauseInstanceId={pauseInstanceId}
          />
        </CompanionOrchestratedCard>
      ) : null,
    grounding: hasGrounding ? (
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
          appearance={appearance}
          iconHelp={iconHelps?.grounding}
          showFullViewButton={frameAppearance ? false : showFullViewButton}
          {...proFavorite('grounding')}
        >
          <GroundingDisplay
            title={companions.groundingTitle ?? ''}
            body={companions.groundingBody ?? ''}
            nudge={nudge}
            nudgeLoading={nudgeLoading}
            nudgeError={nudgeError}
            onRetry={retryNudge}
            variant={frameAppearance ? 'frame' : 'default'}
            pauseInstanceId={pauseInstanceId}
          />
        </CompanionOrchestratedCard>
      ) : null,
    zoomOut: hasZoomOut ? (
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
          appearance={appearance}
          iconHelp={iconHelps?.zoomOut}
          showFullViewButton={showFullViewButton}
          {...proFavorite('zoom_out')}
        >
          <ZoomOutDisplay data={zoomOut} loading={zoomOutLoading} error={zoomOutError} onRetry={retryZoomOut} />
        </CompanionOrchestratedCard>
      ) : null,
    history: hasHistory ? (
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
          hasContent={Boolean(historyDisplay)}
          relaxationKey={cacheRelaxations.history}
          companionType="history_insight"
          cacheId={cacheIds.history}
          regenerateSlot="history"
          onRegenerate={() => regenerateCompanion('history')}
          routeSegment="history"
          appearance={appearance}
          iconHelp={iconHelps?.lookBack}
          showFullViewButton
          {...proFavorite('history_insight')}
        >
          <HistoricalInsightDisplay
            data={historyDisplay}
            loading={historyLoading}
            error={historyError}
            onRetry={retryHistory}
          />
        </CompanionOrchestratedCard>
      ) : null,
  };

  return (
    <>
      {slotOrder.map((key) => (
        <div key={key}>{slots[key]}</div>
      ))}
    </>
  );
}
