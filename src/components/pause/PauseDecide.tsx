import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { hapticFeedback } from '@/lib/haptics';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onDecide: (decision: string) => void;
  /** Return to the prior macro step (second Breathe). */
  onBack?: () => void;
  /** Optional kicker above the title (e.g. brief vs deep step label). */
  introKicker?: string;
  /** Brief decide layout: primary Hold pill + outlined Buy/Sell; hide footer Back on choices. */
  briefDecidePillLayout?: boolean;
  /** When true, the choices-screen footer Back row is omitted (stepper-only nav). */
  hideChoicesBack?: boolean;
}

export function PauseDecide({ onDecide, onBack, introKicker, briefDecidePillLayout, hideChoicesBack }: Props) {
  const { t } = useTranslation();
  const [mirrorDecision, setMirrorDecision] = useState<string | null>(null);

  /** Figma brief Decide: stepper + “n of total” carry step context — no duplicate “Step 4 · Decide” line. */
  const introLine =
    introKicker != null && introKicker.trim() !== ''
      ? introKicker
      : briefDecidePillLayout
        ? null
        : t('pause.decideIntroKicker', { defaultValue: 'Step 6 · Decide' });

  const handleHold = () => {
    hapticFeedback('medium');
    onDecide('held');
  };

  const handleAction = (value: 'sold' | 'bought') => {
    hapticFeedback('medium');
    setMirrorDecision(value);
  };

  const confirmMirror = () => {
    if (mirrorDecision) {
      hapticFeedback('medium');
      onDecide(mirrorDecision);
    }
  };

  const cancelMirror = () => {
    hapticFeedback('light');
    setMirrorDecision(null);
  };

  const mirrorKey = mirrorDecision === 'sold' ? 'sell' : 'buy';

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!mirrorDecision ? (
          <motion.div
            key="choices"
            className={cn(
              'flex flex-col items-center gap-8 w-full',
              briefDecidePillLayout ? 'max-w-sm' : 'max-w-xs',
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              {introLine ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {introLine}
                </p>
              ) : null}
              <p className={pauseStepLayout.screenTitle}>{t('pause.whatWillYouDo')}</p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('pause.decideSubcopy', { defaultValue: "You're choosing from your center." })}
              </p>
            </div>

            {briefDecidePillLayout ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  onClick={handleHold}
                  className={cn(
                    pauseStepLayout.ritualPrimaryCta,
                    'flex h-auto min-h-12 w-full max-w-[280px] items-center justify-center gap-3 rounded-full py-4',
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10">
                    <OutcomeIcon outcome="held" size={18} className="text-primary-foreground" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide">
                    {t('pause.brief.decide.holdPrimary', { defaultValue: 'Hold' })}
                  </span>
                </Button>
                <div className="flex w-full max-w-[280px] gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAction('bought')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-primary/40 bg-primary/5 py-3 text-xs font-semibold text-foreground hover:bg-primary/10"
                  >
                    <OutcomeIcon outcome="bought" size={14} className="text-muted-foreground" />
                    {t('ritual.decide.buy', { defaultValue: 'I bought' })}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAction('sold')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-primary/40 bg-primary/5 py-3 text-xs font-semibold text-foreground hover:bg-primary/10"
                  >
                    <OutcomeIcon outcome="sold" size={14} className="text-muted-foreground" />
                    {t('ritual.decide.sell', { defaultValue: 'I sold' })}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Primary: Hold */}
                <motion.button
                  onClick={handleHold}
                  whileTap={{ scale: 0.97 }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-nox-border-default/60 bg-nox-background-accent/20 py-5 transition-all duration-300 hover:border-nox-border-focus/40 hover:bg-nox-background-accent/35"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/50">
                    <OutcomeIcon outcome="held" size={18} className="text-muted-foreground" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide text-foreground">
                    {t('ritual.decide.hold', { defaultValue: "I'm holding" })}
                  </span>
                </motion.button>

                {/* Secondary: Sell / Buy */}
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => handleAction('bought')}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <OutcomeIcon outcome="bought" size={14} className="text-muted-foreground" />
                    {t('ritual.decide.buy', { defaultValue: 'I bought' })}
                  </button>
                  <span className="text-muted-foreground/40" aria-hidden>
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAction('sold')}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <OutcomeIcon outcome="sold" size={14} className="text-muted-foreground" />
                    {t('ritual.decide.sell', { defaultValue: 'I sold' })}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="mirror"
            className="flex flex-col items-center gap-6 max-w-xs text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t('pause.decideMirrorKicker', { defaultValue: 'Before you confirm' })}
              </p>
              <p className="text-center font-editorial text-xl text-foreground sm:text-2xl">
                {t('mirror.title', { defaultValue: 'Decision Mirror' })}
              </p>
            </div>

            <div className="w-full space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.6, duration: 0.8 }}
                  className="text-center text-sm italic leading-relaxed text-muted-foreground"
                >
                  {t(`mirror.${mirrorKey}.q${i}`)}
                </motion.p>
              ))}
            </div>

            <motion.div
              className="flex flex-col items-center gap-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.8 }}
            >
              <Button
                type="button"
                variant="default"
                className={cn(
                  pauseStepLayout.ritualPrimaryCta,
                  'h-auto min-h-10 max-w-sm whitespace-normal py-3 leading-snug',
                )}
                onClick={confirmMirror}
              >
                {t(`mirror.confirm.${mirrorKey}`, {
                  defaultValue: mirrorKey === 'sell' ? 'I still want to sell' : 'I still want to buy',
                })}
              </Button>
              <button
                type="button"
                onClick={cancelMirror}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('mirror.reconsider', { defaultValue: 'Let me reconsider' })}
              </button>
            </motion.div>

            {onBack ? (
              <motion.div
                className={pauseStepLayout.backRow}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 0.8 }}
              >
                <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
                  <ChevronLeft className="h-3 w-3" />
                  {t('pause.steps.back', { defaultValue: 'Back' })}
                </button>
              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back link (choices only — mirror uses row inside mirror block) */}
      {onBack && !mirrorDecision && !hideChoicesBack ? (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
