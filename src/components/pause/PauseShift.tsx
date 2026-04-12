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
            className="max-w-sm text-center font-editorial text-xl leading-snug text-foreground sm:text-2xl"
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
              <MoodIcon mood={selectedMoodAfter} size={28} className="text-muted-foreground transition-colors group-hover:text-foreground" />
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                {t(`moodCheck.moods.${selectedMoodAfter}`)}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', 'tap to change')}
              </p>
            </button>
          ) : (
            <button
              onClick={onMoodAfterReset}
              className="group flex flex-col items-center gap-1"
            >
              <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t('common.skipped', 'Skipped')}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
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
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('pause.groundingNudge', 'Still feeling it? Maybe step away and try {{activity}} for a few minutes.', { activity: suggestedActivity })}
              </p>
              <button
                type="button"
                onClick={() => navigate('/ground')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <Anchor className="h-2.5 w-2.5" />
                {t('pause.goGround', 'Ground yourself')}
              </button>
            </motion.div>
          )}

          <button
            type="button"
            onClick={onContinue}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
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
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', 'Back')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
