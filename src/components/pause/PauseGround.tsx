import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { ChevronLeft } from 'lucide-react';

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
  onBack?: () => void;
}

export function PauseGround({
  companions, companionPrefs, severity, reflectionId, context, reflectionMessage,
  moodAfterDone, onMoodAfterSelect, onMoodAfterSkip, onContinue, onBack,
}: Props) {
  const { t } = useTranslation();
  const [showShiftCheck, setShowShiftCheck] = useState(false);

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

      {/* Lighter mood-after: subtle shift check */}
      {!moodAfterDone ? (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            {!showShiftCheck ? (
              <motion.div
                key="prompt"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <button
                  onClick={() => setShowShiftCheck(true)}
                  className="text-[10px] font-mono text-muted-foreground/35 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.15em] uppercase"
                >
                  {t('pause.didAnythingShift', 'Did anything shift?')}
                </button>
                <button
                  onClick={() => { onMoodAfterSkip(); }}
                  className="text-[9px] font-mono text-muted-foreground/20 hover:text-muted-foreground/35 transition-colors duration-500 tracking-[0.12em] uppercase"
                >
                  {t('pause.steps.continue', 'Continue')}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="mood"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <MoodCheck onSelect={onMoodAfterSelect} onSkip={onMoodAfterSkip} variant="after" />
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Back link */}
      {onBack && (
        <motion.div
          className="flex justify-center pt-2"
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
