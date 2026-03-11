import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';

interface Props {
  reflectionId: string | null;
  message: string;
  context: string | null;
  onMoodSelect: (mood: MoodValue) => void;
  onMoodSkip: () => void;
  moodDone: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseFeel({ reflectionId, message, context, onMoodSelect, onMoodSkip, moodDone, onContinue, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Context */}
      {context && (
        <motion.p
          className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em] text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {context}
        </motion.p>
      )}

      {/* Full reflection message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <p className="text-[17px] leading-[1.8] text-foreground/85 font-light">{message}</p>
      </motion.div>

      {/* Mood check — affect labeling first */}
      {!moodDone ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <MoodCheck onSelect={onMoodSelect} onSkip={onMoodSkip} variant="before" />
        </motion.div>
      ) : (
        <>
          {/* Note & tags appear after mood is done */}
          {reflectionId && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <ReflectionNote reflectionId={reflectionId} initialNote={null} />
              <ReflectionTags reflectionId={reflectionId} initialTags={[]} />
            </motion.div>
          )}

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
        </>
      )}
    </motion.div>
  );
}
