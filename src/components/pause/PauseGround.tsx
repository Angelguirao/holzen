import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';

interface Props {
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  reflectionId: string | null;
  context: string | null;
  reflectionMessage: string;
  moodAfterDone: boolean;
  onMoodAfterSelect: (mood: MoodValue) => void;
  onMoodAfterSkip: () => void;
  onContinue: () => void;
}

export function PauseGround({
  companions, companionPrefs, severity, reflectionId, context, reflectionMessage,
  moodAfterDone, onMoodAfterSelect, onMoodAfterSkip, onContinue,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <CompanionSection
        companions={companions}
        prefs={companionPrefs}
        severity={severity}
        reflectionId={reflectionId}
        context={context}
        reflectionMessage={reflectionMessage}
      />

      {/* Mood after grounding */}
      {!moodAfterDone ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <MoodCheck onSelect={onMoodAfterSelect} onSkip={onMoodAfterSkip} variant="after" />
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
