import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/use-subscription';
import { PRICING } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import { ScoreImpact } from './ScoreImpact';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';

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

  if (doneVariant === 'brief') {
    const outcomeHeadline =
      decision === 'held'
        ? t('pause.brief.done.outcomeHeld')
        : decision === 'sold'
          ? t('pause.brief.done.outcomeSold')
          : decision === 'bought'
            ? t('pause.brief.done.outcomeBought')
            : t('pause.brief.done.outcomeFallback', { defaultValue: 'Nice work' });

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={pauseStepLayout.columnDone}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t('pause.brief.done.completedSaved')}
          </p>
          <h2 className="font-editorial text-2xl leading-tight text-foreground sm:text-3xl">{outcomeHeadline}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('pause.brief.done.journeyBody')}</p>

          <div className="w-full rounded-2xl border border-border/60 bg-card/40 px-5 py-6 text-left shadow-sm">
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t('pause.brief.done.optionalBlockTitle')}
            </p>
            <p className="mt-4 text-center font-editorial text-lg italic text-primary">
              {t('pause.brief.done.regulationPreview')}
            </p>
            {moodLabel ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t('pause.brief.done.lastEmotionLabel')}: </span>
                {moodLabel}
              </p>
            ) : null}
            {onSaveToJourney ? (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="default"
                  className={cn(pauseStepLayout.ritualPrimaryCta, 'rounded-full px-8')}
                  onClick={() => onSaveToJourney()}
                >
                  {t('pause.brief.done.saveToJourney')}
                </Button>
              </div>
            ) : null}
          </div>

          <Button type="button" variant="outline" className="mt-2 rounded-full" onClick={onReturn}>
            {t('pause.return')}
          </Button>
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
