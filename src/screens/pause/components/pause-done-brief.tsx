import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PAUSE_MOOD_VALUES } from '@/screens/pause/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { PAUSE_FEEL_INTENSITY_KEYS, pauseStepLayout } from '@/features/pause/public';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { usePauseBriefDoneCheckIn } from '@/features/pause/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
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

  const outcomeHeadline =
    decision === 'held'
      ? t('pause.brief.done.outcomeHeld')
      : decision === 'sold'
        ? t('pause.brief.done.outcomeSold')
        : decision === 'bought'
          ? t('pause.brief.done.outcomeBought')
          : t('pause.brief.done.outcomeFallback', { defaultValue: 'Nice work' });

  const outcomeIconKey =
    decision === 'held' || decision === 'sold' || decision === 'bought' ? decision : 'held';

  const moodLabel =
    briefDoneMood != null ? t(`moodCheck.moods.${briefDoneMood}`, { defaultValue: briefDoneMood }) : null;

  const checkInRowRightHint = t('pause.brief.done.checkInRowRightHint', {
    defaultValue:
      'Optional: if how you feel now changed after deciding, adjust mood or intensity and tap Save so Journey reflects your after-state.',
  });

  const journeyShort = t('pause.brief.done.journeyShort', {
    defaultValue: 'This pause is now part of your Journey.',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={pauseStepLayout.columnDone}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-10 text-center">
        <p className="text-base font-medium italic leading-6 text-muted-foreground">
          {t('pause.brief.done.completedSaved')}
        </p>

        <div className="flex flex-col items-center gap-4">
          <OutcomeIcon outcome={outcomeIconKey} size={44} className="text-foreground" aria-hidden />
          <div className="flex max-w-sm flex-col gap-2">
            <h2 className="text-[22px] font-normal leading-7 tracking-tight text-foreground">{outcomeHeadline}</h2>
          </div>
        </div>

        <div className="w-full max-w-md space-y-3 text-center">
          <p className="text-sm font-medium leading-snug text-foreground">{journeyShort}</p>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-foreground">
            {t('pause.brief.done.practiceAffirmLead', {
              defaultValue:
                'Stopping to decide is what matters here. Journey learns from your pauses over time — not a single grade on this moment.',
            })}
          </p>
          <p className="mx-auto max-w-sm text-[11px] leading-relaxed text-muted-foreground">
            {t('pause.brief.done.statsPatternExplainer', {
              defaultValue:
                'Holzen and skill bars in Stats summarize patterns across many completed pauses. They can move slowly and are never a verdict on whether pausing was the right call.',
            })}
          </p>
        </div>

        <div className="w-full max-w-md space-y-4 rounded-xl border border-primary bg-card p-4 text-left shadow-sm">
          <p className="text-center text-sm font-medium leading-5 tracking-wide text-foreground">
            {t('pause.brief.done.checkInSectionTitle', { defaultValue: 'How are you now?' })}
          </p>

          <div className="flex w-full items-start justify-between gap-3 text-sm leading-5 text-foreground">
            <span className="shrink-0 font-normal">
              {t('pause.brief.done.checkInRowLeft', { defaultValue: 'Check in again' })}
            </span>
            <span className="line-clamp-4 max-w-[62%] text-right text-xs font-normal leading-snug text-muted-foreground sm:text-sm">
              {checkInRowRightHint}
            </span>
          </div>

          <div className="rounded-lg border-2 border-muted-foreground/35 bg-muted p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 text-sm font-medium text-muted-foreground">
                  {t('pause.brief.done.lastEmotionLabel', { defaultValue: 'Feel' })}
                </span>
                {briefDoneMood && moodLabel ? (
                  <>
                    <MoodIcon mood={briefDoneMood} size={20} className="shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm font-medium text-foreground">{moodLabel}</span>
                  </>
                ) : (
                  <span className="truncate text-sm text-muted-foreground">
                    {t('pause.brief.done.pickMood', { defaultValue: 'Tap pencil to choose' })}
                  </span>
                )}
              </div>
              <Popover open={moodEditorOpen} onOpenChange={setMoodEditorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={t('pause.brief.done.editMoodAria', { defaultValue: 'Edit emotion' })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[min(20rem,calc(100vw-2rem))] p-3"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                    {t('pause.brief.done.moodPickerTitle', { defaultValue: 'Choose emotion' })}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PAUSE_MOOD_VALUES.map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-pressed={briefDoneMood === value}
                        onClick={() => {
                          setBriefDoneMood(value);
                          setMoodEditorOpen(false);
                        }}
                        className={cn(
                          'flex h-auto flex-col items-center gap-1 border-border/60 py-2 text-[10px] font-medium leading-tight text-foreground transition-colors',
                          briefDoneMood === value && 'border-primary/70 bg-primary/8',
                        )}
                      >
                        <MoodIcon mood={value} size={18} className="text-muted-foreground" />
                        {t(`moodCheck.moods.${value}`, { defaultValue: value })}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-4 space-y-2.5">
              <Slider
                aria-label={t('pause.feelStep.intensityTitle', { defaultValue: 'How strong?' })}
                min={1}
                max={5}
                step={1}
                value={[briefDoneIntensity]}
                onValueChange={(v) => setBriefDoneIntensity(Math.min(5, Math.max(1, v[0] ?? 3)))}
                className="w-full py-1"
              />
              <div className="flex justify-between gap-1 px-0.5 text-center text-[10px] text-muted-foreground sm:text-xs">
                {PAUSE_FEEL_INTENSITY_KEYS.map((key) => (
                  <span
                    key={key}
                    className={cn(
                      'min-w-0 flex-1 truncate',
                      key === PAUSE_FEEL_INTENSITY_KEYS[briefDoneIntensity - 1] && 'font-medium text-foreground',
                    )}
                  >
                    {t(`pause.feelStep.intensity.${key}`, { defaultValue: key })}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {!pauseData ? (
            <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
              {t('pause.brief.done.contributionWhenNoSnapshot', {
                defaultValue: 'Save to Journey to see this pause in your stats.',
              })}
            </p>
          ) : null}

          {onSaveToJourney ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                disabled={saveBusy}
                className={cn(
                  'rounded-full border-primary bg-primary/5 px-6 py-2.5 text-sm font-medium text-primary shadow-sm hover:bg-primary/10',
                  saveBusy && 'opacity-70',
                )}
                onClick={() => void handleSaveToJourney()}
              >
                {saveBusy
                  ? t('pause.brief.done.saveToJourneySaving', { defaultValue: 'Saving…' })
                  : t('pause.brief.done.saveToJourney')}
              </Button>
            </div>
          ) : null}
        </div>
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
