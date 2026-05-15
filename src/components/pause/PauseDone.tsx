import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Flame, Pencil, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/use-subscription';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { PAUSE_FEEL_INTENSITY_KEYS } from '@/components/pause/pause-feel-intensity-labels';
import { PRICING } from '@/lib/pricing';
import { TOOLS } from '@/lib/app-routes';
import { cn } from '@/lib/utils';
import { ScoreImpact } from './ScoreImpact';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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
  /** Brief only: clears session and navigates to Journey (stats). */
  onSaveToJourney?: () => void;
}

export function PauseDone({ decision, onReturn, pauseData, doneVariant = 'default', onSaveToJourney }: Props) {
  const { t } = useTranslation();
  const { subscribed, monthlyUsed, startCheckout, checkoutLoading } = useSubscription();

  const justHitLimit = !subscribed && monthlyUsed >= PRICING.freeReflectionsPerMonth;

  const moodKey = pauseData?.mood;
  const moodLabel =
    moodKey && typeof moodKey === 'string'
      ? t(`moodCheck.moods.${moodKey}`, { defaultValue: moodKey })
      : null;

  const [briefDoneIntensity, setBriefDoneIntensity] = useState(() =>
    Math.min(5, Math.max(1, pauseData?.feelIntensity ?? 3)),
  );
  useEffect(() => {
    const n = pauseData?.feelIntensity;
    if (typeof n === 'number' && n >= 1 && n <= 5) setBriefDoneIntensity(n);
  }, [pauseData?.feelIntensity]);

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
              <p className="text-sm leading-5 text-foreground">{t('pause.brief.done.journeyBody')}</p>
            </div>
          </div>

          <div className="w-full rounded-xl border-2 border-primary bg-muted/20 p-4 text-left shadow-sm">
            <p className="text-center text-sm font-medium leading-5 text-foreground">
              {t('pause.brief.done.optionalBlockTitle')}
            </p>

            <div className="mt-4 flex w-full items-start justify-between gap-3 text-sm leading-5 text-foreground">
              <Link
                to={TOOLS.practice.checkin}
                className="shrink-0 font-normal text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                {t('pause.brief.done.checkInAgain', { defaultValue: 'Check in again' })}
              </Link>
              <span className="text-right text-sm italic text-muted-foreground">
                {t('pause.brief.done.checkInMeta', { defaultValue: 'Optional' })}
              </span>
            </div>

            {moodLabel ? (
              <div className="mt-4 rounded-lg border-2 border-muted-foreground/35 bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="shrink-0 text-sm font-medium text-muted-foreground">
                      {t('pause.brief.done.lastEmotionLabel')}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate text-sm font-medium text-foreground">{moodLabel}</span>
                  </div>
                  <Link
                    to={TOOLS.practice.checkin}
                    className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={t('pause.brief.done.editMoodAria', { defaultValue: 'Update mood in check-in' })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Link>
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
                  <div className="flex justify-between gap-1 px-0.5 text-center text-xs text-muted-foreground sm:text-sm">
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
                  <p className="pt-1 text-center text-xs leading-snug text-muted-foreground">
                    {t('pause.brief.done.intensityFootnote')}
                  </p>
                </div>
              </div>
            ) : null}

            {onSaveToJourney ? (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(pauseStepLayout.ritualPrimaryOutlineCta, 'rounded-full px-6')}
                  onClick={() => onSaveToJourney()}
                >
                  {t('pause.brief.done.saveToJourney')}
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
        <p className="text-sm font-medium text-muted-foreground">
          {t('outcome.streakUpdated')}
        </p>
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

      {/* Score impact summary */}
      {pauseData && <ScoreImpact data={pauseData} />}

      {/* Gentle upsell when free user hits limit */}
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
