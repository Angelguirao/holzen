import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { usePauseBriefDoneCheckIn } from '@/features/pause/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { PauseDoneBriefCheckInPanel } from '@/screens/pause/components/pause-done-brief-check-in-panel';
import { PauseDoneBriefJourneyCopy } from '@/screens/pause/components/pause-done-brief-journey-copy';
import { PauseDoneBriefOutcomeHero } from '@/screens/pause/components/pause-done-brief-outcome-hero';
import { PauseDoneReflectShareRow } from '@/screens/pause/components/pause-done-reflect-share-row';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';

export type PauseDoneBriefProps = {
  decision: string | null;
  pauseData?: PauseDonePauseData | null;
  pauseInstanceId?: string | null;
  onSaveToJourney?: () => void;
};

/** Brief ritual completion screen (outcome, journey copy, optional post-pause check-in). */
export function PauseDoneBrief({ decision, pauseData, pauseInstanceId, onSaveToJourney }: PauseDoneBriefProps) {
  const { t } = useTranslation();
  const { subscribed } = useSubscription();
  const {
    briefDoneMood,
    setBriefDoneMood,
    briefDoneIntensity,
    setBriefDoneIntensity,
    moodEditorOpen,
    setMoodEditorOpen,
    saveBusy,
    handleSaveToJourney,
  } = usePauseBriefDoneCheckIn({
    doneVariant: 'brief',
    pauseInstanceId,
    pauseData,
    onSaveToJourney,
    t,
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={pauseStepLayout.columnDone}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-10 text-center">
        <PauseDoneBriefOutcomeHero decision={decision} />

        <PauseDoneBriefJourneyCopy />

        <PauseDoneBriefCheckInPanel
          briefDoneMood={briefDoneMood}
          setBriefDoneMood={setBriefDoneMood}
          briefDoneIntensity={briefDoneIntensity}
          setBriefDoneIntensity={setBriefDoneIntensity}
          moodEditorOpen={moodEditorOpen}
          setMoodEditorOpen={setMoodEditorOpen}
          saveBusy={saveBusy}
          handleSaveToJourney={handleSaveToJourney}
          pauseData={pauseData}
          onSaveToJourney={onSaveToJourney}
        />

        <PauseDoneReflectShareRow
          subscribed={subscribed}
          reflectionMessage={pauseData?.reflectionMessage}
          context={pauseData?.context}
          haiku={pauseData?.haiku}
          wallpaperMood={briefDoneMood}
          pauseInstanceId={pauseInstanceId}
        />
      </div>
    </motion.div>
  );
}
