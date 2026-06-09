import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resolveDoneWallpaperMood, usePauseBriefDoneCheckIn } from '@/features/pause/public-ritual-done';
import { pauseStepLayout } from '@/features/pause/public-session';
import { useSubscription } from '@/features/subscription/public-hooks';
import { PauseDoneBriefCheckInPanel } from '@/screens/pause/components/pause-done-brief-check-in-panel';
import { PauseDoneBriefOutcomeHero } from '@/screens/pause/components/pause-done-brief-outcome-hero';
import { PauseDoneReflectShareRow } from '@/screens/pause/components/pause-done-reflect-share-row';
import { PauseDoneSummaryCard } from '@/screens/pause/components/pause-done-summary-card';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';

export type PauseDoneBriefProps = {
  decision: string | null;
  pauseData?: PauseDonePauseData | null;
  pauseInstanceId?: string | null;
  onSaveToJourney?: () => void;
};

/** Brief ritual completion screen (outcome, journey copy, optional post-pause check-in). */
export function PauseDoneBrief({ decision, pauseData, pauseInstanceId, onSaveToJourney }: PauseDoneBriefProps) {
  "use memo";
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
    savedEndedFeel,
    postCheckInXpBonus,
  } = usePauseBriefDoneCheckIn({
    doneVariant: 'brief',
    pauseInstanceId,
    pauseData,
    onSaveToJourney,
    t,
  });

  const wallpaperMood = resolveDoneWallpaperMood(
    savedEndedFeel
      ? { mood: pauseData?.mood, moodAfter: savedEndedFeel.mood }
      : pauseData,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={pauseStepLayout.columnDone}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-10 text-center">
        <PauseDoneBriefOutcomeHero decision={decision} />

        {pauseData ? (
          <PauseDoneSummaryCard
            pauseData={pauseData}
            endedMood={savedEndedFeel?.mood ?? null}
            endedIntensity={savedEndedFeel?.intensity ?? null}
            postCheckInXpBonus={postCheckInXpBonus}
          />
        ) : null}

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
          wallpaperMood={wallpaperMood}
          pauseInstanceId={pauseInstanceId}
        />
      </div>
    </motion.div>
  );
}
