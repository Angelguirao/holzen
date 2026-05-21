import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { pauseStepLayout } from '@/features/pause/public-hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PauseDecideChoicesProps = {
  introLine: string | null;
  onHold: () => void;
  onBought: () => void;
  onSold: () => void;
};

/** Primary decide step: hold vs buy/sell (before decision mirror). */
export function PauseDecideChoices({ introLine, onHold, onBought, onSold }: PauseDecideChoicesProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="choices"
      className="flex w-full max-w-sm flex-col items-center gap-8"
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

      <Button
        type="button"
        variant="default"
        onClick={onHold}
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
          onClick={onBought}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border-primary/40 bg-primary/5 py-3 text-xs font-semibold text-foreground hover:bg-primary/10"
        >
          <OutcomeIcon outcome="bought" size={14} className="text-muted-foreground" />
          {t('ritual.decide.buy', { defaultValue: 'I bought' })}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSold}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border-primary/40 bg-primary/5 py-3 text-xs font-semibold text-foreground hover:bg-primary/10"
        >
          <OutcomeIcon outcome="sold" size={14} className="text-muted-foreground" />
          {t('ritual.decide.sell', { defaultValue: 'I sold' })}
        </Button>
      </div>
    </motion.div>
  );
}
