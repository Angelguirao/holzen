import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Pencil, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useSubscription } from '@/hooks/use-subscription';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { PAUSE_FEEL_INTENSITY_KEYS } from '@/components/pause/pause-feel-intensity-labels';
import type { MoodValue } from '@/components/MoodCheck';
import { PAUSE_MOOD_VALUES } from '@/components/MoodCheck';
import { PRICING } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { ScoreImpact } from './ScoreImpact';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { pauseLogStep } from '@/lib/pause-api';
import { buildPostPauseEmotionLoggedPayload, isPauseMoodValue } from '@/lib/pause-post-pause-emotion-log';
import { buildPauseScoreImpacts } from '@/lib/pause-score-impacts';
import { showPauseStepSyncFailedToast } from '@/lib/pause-step-sync-toast';

interface PauseData {
  mood: string | null;
  moodAfter: string | null;
  breathingCompleted: boolean;
  decision: string | null;
  context: string | null;
  engagedTools: number;
  wroteNote: boolean;
  usedTags: boolean;
  feelIntensity?: number | null;
  shiftIntensity?: number | null;
  reinforcementQuote?: string | null;
}

interface Props {
  decision: string | null;
  onReturn: () => void;
  pauseData?: PauseData | null;
  /** Brief ritual completion: journey CTA + optional check-in block. */
  doneVariant?: 'default' | 'brief';
  /** Brief only: runs after optional mood RPC; clears session and navigates to Journey. */
  onSaveToJourney?: () => void;
  /** When set, brief Save to journey can persist post-completion mood via `post_pause_emotion_logged`. */
  pauseInstanceId?: string | null;
}

function clampFeelIntensity(n: number | null | undefined): number {
  if (typeof n === 'number' && n >= 1 && n <= 5) return n;
  return 3;
}

/** Brief done: replaces generic “saved to Journey” with decision + entry-mood–specific copy. */
function briefJourneyPrimaryLine(t: TFunction, pauseData: PauseData | null | undefined, decisionProp: string | null): string {
  const dec = (pauseData?.decision ?? decisionProp)?.toLowerCase() ?? '';
  const entryMood =
    pauseData?.mood && isPauseMoodValue(pauseData.mood)
      ? t(`moodCheck.moods.${pauseData.mood}`, { defaultValue: pauseData.mood })
      : null;

  if (dec === 'held' && entryMood) {
    return t('pause.brief.done.journeyPersonalHeldWithMood', { mood: entryMood });
  }
  if (dec === 'held') {
    return t('pause.brief.done.journeyPersonalHeld');
  }
  if (dec === 'sold' && entryMood) {
    return t('pause.brief.done.journeyPersonalSoldWithMood', { mood: entryMood });
  }
  if (dec === 'sold') {
    return t('pause.brief.done.journeyPersonalSold');
  }
  if (dec === 'bought' && entryMood) {
    return t('pause.brief.done.journeyPersonalBoughtWithMood', { mood: entryMood });
  }
  if (dec === 'bought') {
    return t('pause.brief.done.journeyPersonalBought');
  }
  return t('pause.brief.done.journeyLead', { defaultValue: 'This pause is saved to your Journey.' });
}

/** Second line under journey primary — echoes their decision, then the “many pauses” framing. */
function briefPersonalityKicker(t: TFunction, pauseData: PauseData | null | undefined, decisionProp: string | null): string {
  const dec = (pauseData?.decision ?? decisionProp)?.toLowerCase() ?? '';
  if (dec === 'held') {
    return t('pause.brief.done.personalityKickerHeld', {
      defaultValue:
        'After a hold like this, every pause still nudges the picture Holzen builds of you under pressure — Journey infers that personality slowly from your pattern, not one headline.',
    });
  }
  if (dec === 'sold') {
    return t('pause.brief.done.personalityKickerSold', {
      defaultValue:
        'After a sell like this, each pause still feeds the story your stats tell about tolerance and alignment — it sharpens across many decisions, not a single swing.',
    });
  }
  if (dec === 'bought') {
    return t('pause.brief.done.personalityKickerBought', {
      defaultValue:
        'After a buy like this, each pause still refines how Journey reads your composure under urge — the shape emerges from repetition, not one dramatic number.',
    });
  }
  return t('pause.brief.done.personalityKicker', {
    defaultValue:
      'Each pause strengthens the picture Holzen builds of you under pressure — the shape your Journey stats infer slowly from many pauses, not one headline.',
  });
}

export function PauseDone({
  decision,
  onReturn,
  pauseData,
  doneVariant = 'default',
  onSaveToJourney,
  pauseInstanceId,
}: Props) {
  const { t } = useTranslation();
  const { subscribed, monthlyUsed, startCheckout, checkoutLoading } = useSubscription();

  const justHitLimit = !subscribed && monthlyUsed >= PRICING.freeReflectionsPerMonth;

  const [briefDoneMood, setBriefDoneMood] = useState<MoodValue | null>(null);
  const [briefDoneIntensity, setBriefDoneIntensity] = useState(3);
  const [moodEditorOpen, setMoodEditorOpen] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const initialFeelSnapshotRef = useRef<{ mood: MoodValue | null; intensity: number } | null>(null);

  useLayoutEffect(() => {
    if (doneVariant !== 'brief' || !pauseData) return;
    const m = isPauseMoodValue(pauseData.mood) ? pauseData.mood : null;
    const int = clampFeelIntensity(pauseData.feelIntensity ?? null);
    setBriefDoneMood(m);
    setBriefDoneIntensity(int);
    initialFeelSnapshotRef.current = { mood: m, intensity: int };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mood/feel fields only; full `pauseData` identity would reset in-progress edits
  }, [doneVariant, pauseInstanceId, pauseData?.mood, pauseData?.feelIntensity]);

  const briefImpacts = useMemo(() => {
    if (doneVariant !== 'brief' || !pauseData) return [];
    return buildPauseScoreImpacts(pauseData, t, 'brief');
  }, [doneVariant, pauseData, t]);

  const handleSaveToJourney = async () => {
    if (!onSaveToJourney) return;
    setSaveBusy(true);
    try {
      const snap = initialFeelSnapshotRef.current;
      const feelDirty =
        briefDoneMood != null &&
        (!snap || briefDoneMood !== snap.mood || briefDoneIntensity !== snap.intensity);
      if (pauseInstanceId && feelDirty) {
        await pauseLogStep({
          instanceId: pauseInstanceId,
          stepType: 'post_pause_emotion_logged',
          payload: buildPostPauseEmotionLoggedPayload(briefDoneMood!, briefDoneIntensity),
        });
      }
      onSaveToJourney();
    } catch {
      showPauseStepSyncFailedToast(t);
    } finally {
      setSaveBusy(false);
    }
  };

  if (doneVariant === 'brief') {
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
      briefDoneMood != null
        ? t(`moodCheck.moods.${briefDoneMood}`, { defaultValue: briefDoneMood })
        : null;

    const checkInMetaRight =
      briefImpacts[0] != null
        ? `${briefImpacts[0].label} — ${briefImpacts[0].reason}`
        : t('pause.brief.done.checkInRowRightFallback', {
            defaultValue: 'One more signal for Journey when you save.',
          });

    const journeyPrimary = briefJourneyPrimaryLine(t, pauseData, decision);
    const journeyKicker = briefPersonalityKicker(t, pauseData, decision);

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

          <div className="w-full max-w-md space-y-2 text-center">
            <p className="text-sm font-medium leading-snug text-foreground">{journeyPrimary}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{journeyKicker}</p>
          </div>

          <div className="w-full max-w-md space-y-4 rounded-xl border border-primary bg-card p-4 text-left shadow-sm">
            <p className="text-center text-sm font-medium leading-5 tracking-wide text-foreground">
              {t('pause.brief.done.checkInSectionTitle', { defaultValue: 'How are you now? (Optional)' })}
            </p>

            <div className="flex w-full items-start justify-between gap-3 text-sm leading-5 text-foreground">
              <span className="shrink-0 font-normal">
                {t('pause.brief.done.checkInRowLeft', { defaultValue: 'Optional' })}
              </span>
              <span className="line-clamp-3 max-w-[58%] text-right font-serif text-xs italic leading-snug text-muted-foreground sm:text-sm">
                {checkInMetaRight}
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

            {pauseData ? (
              <ScoreImpact
                data={pauseData}
                variant="brief"
                hideTitle
                excludeFirstFromList
                className="pt-1"
              />
            ) : (
              <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
                {t('pause.brief.done.contributionWhenNoSnapshot', {
                  defaultValue:
                    'When this screen loads without pause details, Journey still keeps your outcome — open Stats after saving to see trends.',
                })}
              </p>
            )}

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
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={pauseStepLayout.columnDone}
    >
      {/* Streak flame celebration */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: 1 }}
          transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-nox-text-highlight/12"
        >
          <Flame className="h-7 w-7 text-muted-foreground" />
        </motion.div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-nox-text-highlight/35"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 6) * 44,
              y: Math.sin((i * Math.PI * 2) / 6) * 44,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex items-center gap-2"
      >
        <Flame className="h-4 w-4 text-nox-text-highlight" />
        <p className="text-sm font-medium text-muted-foreground">{t('outcome.streakUpdated')}</p>
      </motion.div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t('pause.youChose')}</p>
        <p className="font-editorial text-2xl capitalize text-foreground">{decision}</p>
      </div>

      {pauseData?.reinforcementQuote && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="w-full max-w-md rounded-2xl border border-border/60 bg-card/50 px-5 py-6 text-center shadow-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.done.reinforcementKicker', { defaultValue: 'Carry this with you' })}
          </p>
          <p className="mt-3 font-editorial text-lg leading-snug text-foreground sm:text-xl">
            {pauseData.reinforcementQuote}
          </p>
        </motion.div>
      )}

      {pauseData && <ScoreImpact data={pauseData} />}

      {justHitLimit && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex max-w-[300px] flex-col items-center gap-3 rounded-2xl border border-border/30 bg-card/30 px-6 py-5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground/80">
              {t('pause.upsellTitle', {
                defaultValue: "You've used all {{count}} free pauses this month",
                count: PRICING.freeReflectionsPerMonth,
              })}
            </p>
          </div>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {t('pause.upsellBody', {
              defaultValue: 'Unlock unlimited pauses, AI companions, and your full library.',
            })}
          </p>
          <button
            type="button"
            onClick={() => startCheckout()}
            disabled={checkoutLoading}
            className="text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline disabled:opacity-50"
          >
            {t('pause.upsellCta', { defaultValue: 'Start {{days}}-day free trial', days: PRICING.trialDays })}
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: justHitLimit ? 2.5 : 1.5, duration: 1 }}
        className="mt-4"
      >
        <Button type="button" variant="default" className={pauseStepLayout.ritualPrimaryCta} onClick={onReturn}>
          {t('pause.return')}
        </Button>
      </motion.div>
    </motion.div>
  );
}
