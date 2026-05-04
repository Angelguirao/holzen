import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

interface Props {
  onChoose: () => void;
}

/**
 * Short settle screen after the second breath, before the outcome UI.
 * Shares the sixth header segment with Decide (no separate “Choose” bar).
 */
export function PauseChooseBridge({ onChoose }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex max-w-md flex-col items-center gap-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('pause.chooseBridgeKicker', { defaultValue: 'Step 6 · Decide' })}
        </p>
        <p className={pauseStepLayout.screenTitle}>
          {t('pause.chooseBridgeTitle', { defaultValue: 'What feels possible from here?' })}
        </p>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.chooseBridgeBody', {
            defaultValue: 'Take a breath, then choose how you want to move — hold, step back, or act with intention.',
          })}
        </p>
      </div>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        onClick={() => {
          hapticFeedback('light');
          onChoose();
        }}
        className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
      >
        {t('pause.chooseBridgeCta', { defaultValue: 'Choose' })}
      </motion.button>
    </motion.div>
  );
}
