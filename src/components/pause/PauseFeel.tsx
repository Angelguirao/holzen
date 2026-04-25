import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

interface Props {
  onMoodSelect: (mood: MoodValue) => void;
  onMoodSkip: () => void;
  onMoodReset: () => void;
  moodDone: boolean;
  selectedMood?: MoodValue | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseFeel({ onMoodSelect, onMoodSkip, onMoodReset, moodDone, selectedMood, onContinue, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {!moodDone ? (
        <>
          <motion.p
            className={pauseStepLayout.screenTitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t('pause.labelWhatYouFeel', { defaultValue: 'What are you feeling right now?' })}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full"
          >
            <MoodCheck onSelect={onMoodSelect} onSkip={onMoodSkip} variant="before" hideHeading />
          </motion.div>
        </>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {selectedMood ? (
            <button
              onClick={onMoodReset}
              className="flex flex-col items-center gap-2 group"
            >
              <MoodIcon mood={selectedMood} size={28} className="text-muted-foreground transition-colors group-hover:text-foreground" />
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                {t(`moodCheck.moods.${selectedMood}`)}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
          ) : (
            <button
              onClick={onMoodReset}
              className="group flex flex-col items-center gap-1"
            >
              <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t('common.skipped', { defaultValue: 'Skipped' })}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className={pauseStepLayout.textContinue}
          >
            {t('pause.steps.continue', { defaultValue: 'Continue' })}
          </button>
        </motion.div>
      )}

      {/* Back link */}
      {onBack && (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button
            type="button"
            onClick={onBack}
            className={pauseStepLayout.backButton}
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
