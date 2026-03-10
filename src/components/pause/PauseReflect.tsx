import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';

interface Props {
  reflectionId: string | null;
  message: string;
  onMoodSelect: (mood: MoodValue) => void;
  onMoodSkip: () => void;
  moodDone: boolean;
  onContinue: () => void;
}

export function PauseReflect({ reflectionId, message, onMoodSelect, onMoodSkip, moodDone, onContinue }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Full reflection message */}
      <div className="space-y-2">
        <p className="text-[17px] leading-[1.8] text-foreground/85 font-light">{message}</p>
      </div>

      {/* Note & tags */}
      {reflectionId && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <ReflectionNote reflectionId={reflectionId} initialNote={null} />
          <ReflectionTags reflectionId={reflectionId} initialTags={[]} />
        </motion.div>
      )}

      {/* Mood check */}
      {!moodDone ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <MoodCheck onSelect={onMoodSelect} onSkip={onMoodSkip} variant="before" />
        </motion.div>
      ) : (
        <motion.div
          className="flex justify-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <button
            onClick={onContinue}
            className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
          >
            {t('pause.steps.continue', 'Continue')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
