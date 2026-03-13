import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';

interface Props {
  onMoodAfterSelect: (mood: MoodValue) => void;
  onMoodAfterSkip: () => void;
  moodAfterDone: boolean;
  selectedMoodAfter?: MoodValue | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseShift({ onMoodAfterSelect, onMoodAfterSkip, moodAfterDone, selectedMoodAfter, onContinue, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {!moodAfterDone ? (
        <>
          <motion.p
            className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-[0.15em] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t('pause.didAnythingShift', 'Did anything shift?')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="w-full"
          >
            <MoodCheck onSelect={onMoodAfterSelect} onSkip={onMoodAfterSkip} variant="after" />
          </motion.div>
        </>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {selectedMoodAfter ? (
            <>
              <MoodIcon mood={selectedMoodAfter} size={28} className="text-muted-foreground/60" />
              <p className="text-xs font-mono text-muted-foreground/50 tracking-wide">
                {t(`moodCheck.moods.${selectedMoodAfter}`)}
              </p>
            </>
          ) : (
            <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.15em] uppercase">
              {t('common.skipped', 'Skipped')}
            </p>
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
