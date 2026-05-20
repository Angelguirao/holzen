import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PauseRitualBackRow } from '@/screens/pause/components/pause-ritual-back-row';

export type PauseDecideMirrorProps = {
  mirrorDecision: 'sold' | 'bought';
  onConfirm: () => void;
  onCancel: () => void;
  onBack?: () => void;
};

/** Decision mirror interstitial before confirming buy/sell. */
export function PauseDecideMirror({ mirrorDecision, onConfirm, onCancel, onBack }: PauseDecideMirrorProps) {
  const { t } = useTranslation();
  const mirrorKey = mirrorDecision === 'sold' ? 'sell' : 'buy';

  return (
    <motion.div
      key="mirror"
      className="flex max-w-sm flex-col items-center gap-6 text-center"
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
          onClick={onConfirm}
        >
          {t(`mirror.confirm.${mirrorKey}`, {
            defaultValue: mirrorKey === 'sell' ? 'I still want to sell' : 'I still want to buy',
          })}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('mirror.reconsider', { defaultValue: 'Let me reconsider' })}
        </button>
      </motion.div>

      <PauseRitualBackRow onBack={onBack} transitionDelay={2.6} />
    </motion.div>
  );
}
