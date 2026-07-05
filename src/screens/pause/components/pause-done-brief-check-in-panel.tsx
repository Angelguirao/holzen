import { useTranslation } from 'react-i18next';
import type { MoodValue } from '@/features/pause/public-ritual-feel';
import { PauseDoneBriefCheckInFooter } from '@/screens/pause/components/pause-done-brief-check-in-footer';
import { PauseDoneBriefCheckInIntensity } from '@/screens/pause/components/pause-done-brief-check-in-intensity';
import { PauseDoneBriefCheckInMoodRow } from '@/screens/pause/components/pause-done-brief-check-in-mood-row';
import type { PauseDonePauseData } from '@/screens/pause/components/pause-done-types';

export type PauseDoneBriefCheckInPanelProps = {
  briefDoneMood: MoodValue | null;
  setBriefDoneMood: (mood: MoodValue) => void;
  briefDoneIntensity: number;
  setBriefDoneIntensity: (intensity: number) => void;
  moodEditorOpen: boolean;
  setMoodEditorOpen: (open: boolean) => void;
  saveBusy: boolean;
  handleSaveToJourney: () => void | Promise<void>;
  pauseData?: PauseDonePauseData | null;
  onSaveToJourney?: () => void;
};

/** Brief Done: optional post-pause mood/intensity check-in and Save to Journey. */
export function PauseDoneBriefCheckInPanel({
  briefDoneMood,
  setBriefDoneMood,
  briefDoneIntensity,
  setBriefDoneIntensity,
  moodEditorOpen,
  setMoodEditorOpen,
  saveBusy,
  handleSaveToJourney,
  pauseData,
  onSaveToJourney,
}: PauseDoneBriefCheckInPanelProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md space-y-4 rounded-xl border border-primary bg-muted/30 p-4 text-left">
      <p className="text-center text-sm font-medium leading-5 tracking-wide text-foreground">
        {t('pause.brief.done.checkInSectionTitle')}
      </p>

      <div className="flex w-full items-start justify-between gap-3 text-sm leading-5 text-foreground">
        <span className="shrink-0 font-normal">
          {t('pause.brief.done.checkInRowLeft')}
        </span>
        <span className="text-right text-sm text-muted-foreground">
          {t('pause.brief.done.checkInRowXpReward', { count: 5, defaultValue: '+5 XP' })}
        </span>
      </div>

      <div className="rounded-lg border-2 border-muted-foreground/35 bg-muted p-4">
        <PauseDoneBriefCheckInMoodRow
          mood={briefDoneMood}
          onMoodChange={setBriefDoneMood}
          moodEditorOpen={moodEditorOpen}
          onMoodEditorOpenChange={setMoodEditorOpen}
        />
        <PauseDoneBriefCheckInIntensity intensity={briefDoneIntensity} onIntensityChange={setBriefDoneIntensity} />
      </div>

      <PauseDoneBriefCheckInFooter
        showNoSnapshotHint={!pauseData}
        showSaveButton={Boolean(onSaveToJourney)}
        saveBusy={saveBusy}
        onSave={handleSaveToJourney}
      />
    </div>
  );
}
