import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  resolveEffectiveReflectionCopy,
  resolveFrameHaikuDisplayBody,
  usePauseArtifactHaiku,
  usePauseArtifactReflectionText,
} from '@/features/pause/public-ritual-reflect';
import type { CompanionData, CompanionPrefs } from '@/features/pause/public-ritual-frame';
import type { PauseSeverity } from '@/features/pause/public-navigation';
import { pauseStepLayout } from '@/features/pause/public-session';
import { hapticFeedback } from '@/lib/haptics';
import { CompanionSection } from '@/screens/pause/components/CompanionSection';
import {
  PauseFrameShiftMood,
  type PauseFrameShiftMoodProps,
} from '@/screens/pause/components/PauseFrameShiftMood';

export interface PauseFrameProps {
  pauseInstanceId: string | null;
  reflectionMessage: string;
  companionPrefs: CompanionPrefs;
  companions: CompanionData;
  context?: string | null;
  mood?: string | null;
  severity?: PauseSeverity;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  selectedShiftMood: PauseFrameShiftMoodProps['selectedShiftMood'];
  onSelectShiftMood: PauseFrameShiftMoodProps['onSelectShiftMood'];
  onImDone: () => void;
}

/**
 * Figma "Frame" hub: inline accordion companion cards (lazy orchestrate on expand).
 * Full-view routes remain optional inside an expanded card.
 */
export function PauseFrame({
  pauseInstanceId,
  reflectionMessage,
  companionPrefs,
  companions,
  context,
  mood,
  severity = 'mild',
  isFavorite: _isFavorite,
  onToggleFavorite: _onToggleFavorite,
  subscribed: _subscribed,
  selectedShiftMood,
  onSelectShiftMood,
  onImDone,
}: PauseFrameProps) {
  "use memo";
  const { t } = useTranslation();
  const sessionSeedEmpty = !reflectionMessage.trim();
  const { artifactReflectionText } = usePauseArtifactReflectionText({
    pauseInstanceId,
    trigger: 'whenEnabled',
    fetchEnabled: sessionSeedEmpty,
  });
  const effectiveReflectionMessage = resolveEffectiveReflectionCopy(
    reflectionMessage,
    artifactReflectionText,
  );

  const { artifactHaiku, haikuFetch } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled: companionPrefs.haiku,
    trigger: 'whenEnabled',
    fetchEnabled: companionPrefs.haiku && Boolean(pauseInstanceId),
  });

  const frameCompanions = useMemo((): CompanionData => {
    const displayHaiku = resolveFrameHaikuDisplayBody({
      artifactHaiku,
      haikuFetch,
      reflectionMessage: effectiveReflectionMessage,
    }).trim();
    if (!displayHaiku) return companions;
    return { ...companions, haiku: companions.haiku ?? displayHaiku };
  }, [artifactHaiku, companions, effectiveReflectionMessage, haikuFetch]);

  return (
    <motion.div
      className={pauseStepLayout.columnFlow}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full flex-col gap-2 text-center">
        <h2 className={pauseStepLayout.screenTitle}>{t('pause.frame.title', { defaultValue: 'Frame' })}</h2>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.frame.subtitle', { defaultValue: 'Want another angle? Your companions' })}
        </p>
      </div>

      <div className="mt-6 w-full">
        <CompanionSection
          companions={frameCompanions}
          prefs={companionPrefs}
          severity={severity}
          pauseInstanceId={pauseInstanceId}
          context={context}
          reflectionMessage={effectiveReflectionMessage}
          mood={mood}
          hideSectionLead
          exclusiveExpand
          appearance="frame"
          companionSlotOrder="frame"
        />
      </div>

      <PauseFrameShiftMood
        selectedShiftMood={selectedShiftMood}
        onSelectShiftMood={onSelectShiftMood}
      />

      <div className="mt-10 flex w-full justify-center">
        <Button
          type="button"
          variant="outline"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={() => {
            hapticFeedback('light');
            onImDone();
          }}
        >
          {t('pause.frame.imDone', { defaultValue: "I'm done" })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}
