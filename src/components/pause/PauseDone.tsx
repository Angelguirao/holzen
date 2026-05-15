import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Pencil, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSubscription } from '@/hooks/use-subscription';
import { journeyPath } from '@/lib/app-routes';
import { PAUSE_MOOD_VALUES, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { PAUSE_FEEL_INTENSITY_KEYS } from '@/components/pause/pause-feel-intensity-labels';
import { PRICING } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { PauseDoneBriefJourneyRecap } from './PauseDoneBriefJourneyRecap';
import { ScoreImpact } from './ScoreImpact';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { ShareReflection } from '@/components/ShareReflection';
import { ReflectionWallpaper } from '@/components/ReflectionWallpaper';
import { trackEvent } from '@/lib/posthog';
import { isPauseMoodValue, buildPostPauseEmotionLoggedPayload } from '@/lib/pause-post-pause-emotion-log';
import { pauseLogStep } from '@/lib/pause-api';
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
  reflectionMessage?: string | null;
  haiku?: string | null;
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

function PauseDoneReflectShareRow({
  subscribed,
  reflectionMessage,
  context,
  haiku,
  wallpaperMood,
  pauseInstanceId,
}: {
  subscribed: boolean;
  reflectionMessage?: string | null;
  context?: string | null;
  haiku?: string | null;
  wallpaperMood: string | null;
  pauseInstanceId?: string | null;
}) {
  const msg = (reflectionMessage ?? '').trim();
  const trackShareMenuOpen = useCallback(() => {
    trackEvent('pause_reflect_share_tap', { surface: 'pause_done', has_pause_id: !!pauseInstanceId });
  }, [pauseInstanceId]);
  const trackWallpaperTap = useCallback(() => {
    trackEvent('pause_reflect_wallpaper_tap', { surface: 'pause_done' });
  }, []);
  if (!subscribed || !msg) return null;
  const mood = wallpaperMood && isPauseMoodValue(wallpaperMood) ? wallpaperMood : null;
  return (
    <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2 border-t border-border/25 pt-5">
      <ShareReflection
        message={msg}
        context={context ?? null}
        haiku={haiku ?? null}
        onMenuOpen={trackShareMenuOpen}
      />
      <ReflectionWallpaper
        message={msg}
        mood={mood}
        context={context ?? null}
        haiku={haiku ?? null}
        variant="button"
        onGenerateIntent={trackWallpaperTap}
      />
    </div>
  );
}

function clampFeelIntensity(n: number | null | undefined): number {
  if (typeof n === 'number' && n >= 1 && n <= 5) return n;
  return 3;
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
            <PauseDoneBriefJourneyRecap pauseData={pauseData} />
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
            <Link
              to={journeyPath('stats')}
              className="inline-block text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
            >
              {t('pause.brief.done.openStatsCta', { defaultValue: 'How scores work in Journey' })}
            </Link>
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

      <PauseDoneReflectShareRow
        subscribed={subscribed}
        reflectionMessage={pauseData?.reflectionMessage}
        context={pauseData?.context}
        haiku={pauseData?.haiku}
        wallpaperMood={
          pauseData?.moodAfter && isPauseMoodValue(pauseData.moodAfter)
            ? pauseData.moodAfter
            : pauseData?.mood && isPauseMoodValue(pauseData.mood)
              ? pauseData.mood
              : null
        }
        pauseInstanceId={pauseInstanceId}
      />

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
