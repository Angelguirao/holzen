import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';

interface Props {
  onMoodAfterSelect: (mood: MoodValue) => void;
  onMoodAfterSkip: () => void;
  onMoodAfterReset: () => void;
  moodAfterDone: boolean;
  selectedMoodAfter?: MoodValue | null;
  onContinue: () => void;
  onBack?: () => void;
  groundingActivities?: string[];
}

export function PauseShift({ onMoodAfterSelect, onMoodAfterSkip, onMoodAfterReset, moodAfterDone, selectedMoodAfter, onContinue, onBack, groundingActivities = [] }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Pick a random grounding activity to suggest
  const suggestedActivity = groundingActivities.length > 0
    ? groundingActivities[Math.floor(Math.random() * groundingActivities.length)]
    : null;

  // Show nudge when mood is still negative after the shift
  const showGroundingNudge = moodAfterDone && suggestedActivity &&
    selectedMoodAfter && ['anxious', 'fearful', 'frustrated', 'uncertain'].includes(selectedMoodAfter);

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
            <button
              onClick={onMoodAfterReset}
              className="flex flex-col items-center gap-2 group"
            >
              <MoodIcon mood={selectedMoodAfter} size={28} className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              <p className="text-xs font-mono text-muted-foreground/50 tracking-wide group-hover:text-muted-foreground transition-colors">
                {t(`moodCheck.moods.${selectedMoodAfter}`)}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors">
                {t('pause.tapToChange', 'tap to change')}
              </p>
            </button>
          ) : (
            <button
              onClick={onMoodAfterReset}
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

          {/* Grounding nudge — shown when still feeling negative */}
          {showGroundingNudge && (
            <motion.div
              className="mt-2 rounded-lg border border-border/20 bg-muted/15 px-4 py-3 max-w-[260px] text-center space-y-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-xs text-muted-foreground/50 leading-relaxed">
                {t('pause.groundingNudge', 'Still feeling it? Maybe step away and try {{activity}} for a few minutes.', { activity: suggestedActivity })}
              </p>
              <button
                onClick={() => navigate('/ground')}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors"
              >
                <Anchor className="h-2.5 w-2.5" />
                {t('pause.goGround', 'Ground yourself')}
              </button>
            </motion.div>
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
