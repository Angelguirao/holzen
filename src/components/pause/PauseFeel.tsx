import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';

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
              <MoodIcon mood={selectedMood} size={28} className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              <p className="text-xs font-mono text-muted-foreground/50 tracking-wide group-hover:text-muted-foreground transition-colors">
                {t(`moodCheck.moods.${selectedMood}`)}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors">
                {t('pause.tapToChange', 'tap to change')}
              </p>
            </button>
          ) : (
            <button
              onClick={onMoodReset}
              className="group flex flex-col items-center gap-1"
            >
              <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.15em] uppercase group-hover:text-muted-foreground/50 transition-colors">
                {t('common.skipped', 'Skipped')}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors">
                {t('pause.tapToChange', 'tap to change')}
              </p>
            </button>
          )}
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
