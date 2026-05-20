import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';

export type PauseReflectStepNavProps = {
  reflectionLoading: boolean;
  reflectionError: string | null;
  reflectionMessage: string;
  onContinue: () => void;
  onBack?: () => void;
};

/** Continue / back controls for the pause reflect ritual step. */
export function PauseReflectStepNav({
  reflectionLoading,
  reflectionError,
  reflectionMessage,
  onContinue,
  onBack,
}: PauseReflectStepNavProps) {
  const { t } = useTranslation();

  return (
    <>
      <motion.div
        className="flex flex-col items-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
      >
        <Button
          type="button"
          variant="outline"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={onContinue}
          disabled={reflectionLoading || Boolean(reflectionError) || !reflectionMessage.trim()}
        >
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </motion.div>

      {onBack ? (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      ) : null}
    </>
  );
}
