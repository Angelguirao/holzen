import { useTranslation } from 'react-i18next';
import type { RegenerateCompanionSlot } from '@/features/pause/public-ritual-frame';
import { SignalDisplay } from '@/screens/pause/components/SignalDisplay';
import { CompanionOrchestratedCard } from '@/screens/pause/components/companion/companion-orchestrated-card';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';

type SignalPayload = {
  title: string;
  body: string;
  source: string;
  url: string;
} | null;

export type PauseFrameSignalCardProps = {
  label: string;
  expanded: boolean;
  onToggleExpand: () => void;
  completed: boolean;
  onFirstExpandComplete?: () => void;
  pauseInstanceId: string | null;
  signal: SignalPayload;
  signalLoading: boolean;
  signalError: boolean;
  retrySignal: () => void;
  cacheId?: string | null;
  relaxationKey: string | null | undefined;
  regenerateCompanion: (slot: RegenerateCompanionSlot) => void;
};

/** Expandable Signal card on the deep pause Frame step (Figma Lore → Signal). */
export function PauseFrameSignalCard({
  label,
  expanded,
  onToggleExpand,
  completed,
  onFirstExpandComplete,
  pauseInstanceId,
  signal,
  signalLoading,
  signalError,
  retrySignal,
  cacheId,
  relaxationKey,
  regenerateCompanion,
}: PauseFrameSignalCardProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <CompanionOrchestratedCard
      id="signal"
      label={label}
      icon={COMPANION_SECTION_ICONS.signal}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
      completed={completed}
      onFirstExpandComplete={onFirstExpandComplete}
      loading={signalLoading}
      pauseInstanceId={pauseInstanceId}
      hasContent={Boolean(signal)}
      relaxationKey={relaxationKey}
      companionType="signal"
      cacheId={cacheId}
      regenerateSlot="signal"
      onRegenerate={() => regenerateCompanion('signal')}
      routeSegment="signal"
      appearance="frame"
      iconHelp={t('pause.frame.companions.signalHelp')}
      showFullViewButton={false}
    >
      <SignalDisplay
        signal={signal}
        loading={signalLoading}
        error={signalError}
        onRetry={retrySignal}
        variant="frame"
        pauseInstanceId={pauseInstanceId}
      />
    </CompanionOrchestratedCard>
  );
}
