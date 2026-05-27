import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { isPauseReflectContinueDisabled } from '@/features/pause/domain/reflect/generation/is-pause-reflect-continue-disabled';
import { pauseStepLayout } from '@/features/pause/public-session';
import { Button } from '@/components/ui/button';
import { PauseRitualBackRow } from '@/screens/pause/components/pause-ritual-back-row';

export type PauseReflectStepNavProps = {
  reflectionLoading: boolean;
  reflectionError: string | null;
  reflectionMessage: string;
  reflectionContent?: import('@/features/pause/domain/reflect/generation/reflection-content-v2').ReflectionContentV2 | null;
  onContinue: () => void;
  onBack?: () => void;
};

/** Continue / back controls for the pause reflect ritual step. */
export function PauseReflectStepNav({
  reflectionLoading: _reflectionLoading,
  reflectionError,
  reflectionMessage,
  reflectionContent,
  onContinue,
  onBack,
}: PauseReflectStepNavProps) {
  "use memo";
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
          disabled={isPauseReflectContinueDisabled({
            reflectionError,
            reflectionMessage,
            reflectionContent,
          })}
        >
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </motion.div>

      <PauseRitualBackRow onBack={onBack} transitionDelay={0.35} transitionDuration={0.5} />
    </>
  );
}
