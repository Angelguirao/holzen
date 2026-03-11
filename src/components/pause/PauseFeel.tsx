import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';

interface Props {
  onMoodSelect: (mood: MoodValue) => void;
  onMoodSkip: () => void;
  moodDone: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseFeel({ onMoodSelect, onMoodSkip, moodDone, onContinue, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {!moodDone ? (
        <>
          <motion.p
            className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-[0.15em] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t('pause.labelWhatYouFeel', 'What are you feeling right now?')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full"
          >
            <MoodCheck onSelect={onMoodSelect} onSkip={onMoodSkip} variant="before" />
          </motion.div>
        </>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.15em] uppercase">
            {t('pause.feelRecorded', 'Noted')}
          </p>
          <button
            onClick={onContinue}
            className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
          >
            {t('pause.steps.continue', 'Continue')}
          </button>
        </motion.div>
      )}

      {/* Back link */}
      {onBack && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.12em] uppercase"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', 'Back')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
