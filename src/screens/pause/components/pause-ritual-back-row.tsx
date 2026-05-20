import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { pauseStepLayout } from '@/features/pause/public-hooks';

export type PauseRitualBackRowProps = {
  onBack?: () => void;
  /** Framer fade-in delay (seconds). */
  transitionDelay?: number;
  /** Framer fade-in duration (seconds). */
  transitionDuration?: number;
};

/** Ritual step footer: centered Back control (Feel → Decide → Reflect). */
export function PauseRitualBackRow({
  onBack,
  transitionDelay = 0.5,
  transitionDuration = 0.8,
}: PauseRitualBackRowProps) {
  const { t } = useTranslation();

  if (!onBack) return null;

  return (
    <motion.div
      className={pauseStepLayout.backRow}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: transitionDelay, duration: transitionDuration }}
    >
      <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
        <ChevronLeft className="h-3 w-3" />
        {t('pause.steps.back', { defaultValue: 'Back' })}
      </button>
    </motion.div>
  );
}
