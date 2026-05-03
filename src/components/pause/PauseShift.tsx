import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { TOOLS } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

type LocalPhase = 'pick' | 'intensity';

interface Props {
  onMoodAfterSelect: (mood: MoodValue, shiftIntensity?: number) => void;
  onMoodAfterSkip: () => void | Promise<void>;
  onMoodAfterReset: () => void;
  moodAfterDone: boolean;
  selectedMoodAfter?: MoodValue | null;
  /** Prior mood from Feel step — wireframe “show prior emotion”. */
  priorMood?: MoodValue | null;
  shiftIntensity?: number | null;
  onContinue: () => void;
  onBack?: () => void;
  groundingActivities?: string[];
}

export function PauseShift({
  onMoodAfterSelect,
  onMoodAfterSkip,
  onMoodAfterReset,
  moodAfterDone,
  selectedMoodAfter,
  priorMood,
  shiftIntensity,
  onContinue,
  onBack,
  groundingActivities = [],
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [localPhase, setLocalPhase] = useState<LocalPhase>('pick');
  const [pendingMood, setPendingMood] = useState<MoodValue | null>(null);
  const [intensity, setIntensity] = useState(3);

  useEffect(() => {
    if (!moodAfterDone) {
      setLocalPhase('pick');
      setPendingMood(null);
      setIntensity(3);
    }
  }, [moodAfterDone]);

  const suggestedActivity =
    groundingActivities.length > 0 ? groundingActivities[Math.floor(Math.random() * groundingActivities.length)] : null;

  const showGroundingNudge =
    moodAfterDone &&
    suggestedActivity &&
    selectedMoodAfter &&
    ['anxious', 'fearful', 'frustrated', 'uncertain'].includes(selectedMoodAfter);

  const handlePick = (mood: MoodValue) => {
    setPendingMood(mood);
    setLocalPhase('intensity');
  };

  const confirmIntensity = () => {
    if (pendingMood) {
      onMoodAfterSelect(pendingMood, intensity);
    }
  };

  const backFromIntensity = () => {
    setPendingMood(null);
    setLocalPhase('pick');
  };

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {!moodAfterDone ? (
        localPhase === 'pick' ? (
          <>
            <motion.div
              className="space-y-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p className={pauseStepLayout.screenTitle}>
                {t('pause.didAnythingShift', { defaultValue: 'Did anything shift?' })}
              </p>
              <p className={`${pauseStepLayout.screenSubtitle} max-w-xs`}>
                {t('pause.shiftSubcopy', { defaultValue: 'Notice what changed after reflecting — there is no wrong answer.' })}
              </p>
              {priorMood && (
                <div className="mx-auto flex items-center gap-2 rounded-full border border-border/30 bg-card/30 px-3 py-1.5 text-xs text-muted-foreground">
                  <span>{t('pause.shiftPriorLabel', { defaultValue: 'Earlier' })}</span>
                  <MoodIcon mood={priorMood} size={16} className="text-muted-foreground" />
                  <span className="font-medium text-foreground/90">{t(`moodCheck.moods.${priorMood}`)}</span>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full"
            >
              <MoodCheck onSelect={handlePick} onSkip={onMoodAfterSkip} variant="after" hideHeading />
            </motion.div>
          </>
        ) : (
          <motion.div
            className="flex w-full max-w-sm flex-col items-center gap-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className={pauseStepLayout.screenTitle}>
              {t('pause.shiftIntensityTitle', { defaultValue: 'How much did it shift?' })}
            </p>
            {pendingMood && (
              <button type="button" onClick={backFromIntensity} className="group flex flex-col items-center gap-1">
                <MoodIcon mood={pendingMood} size={32} className="text-muted-foreground transition-colors group-hover:text-foreground" />
                <p className="text-sm font-medium text-foreground">{t(`moodCheck.moods.${pendingMood}`)}</p>
                <p className="text-xs text-muted-foreground">{t('pause.tapToChange', { defaultValue: 'tap to change' })}</p>
              </button>
            )}
            <div className="flex w-full flex-col gap-3">
              <div className="flex justify-between px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>{t('pause.shiftIntensityLow', { defaultValue: 'Barely' })}</span>
                <span>{t('pause.shiftIntensityHigh', { defaultValue: 'A lot' })}</span>
              </div>
              <div className="flex justify-center gap-2">
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIntensity(n)}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                      intensity === n
                        ? 'border-primary bg-primary/15 text-foreground'
                        : 'border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30',
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={confirmIntensity} className={pauseStepLayout.textContinue}>
              {t('pause.steps.continue', { defaultValue: 'Continue' })}
            </button>
          </motion.div>
        )
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {selectedMoodAfter ? (
            <button type="button" onClick={onMoodAfterReset} className="group flex flex-col items-center gap-2">
              <MoodIcon mood={selectedMoodAfter} size={28} className="text-muted-foreground transition-colors group-hover:text-foreground" />
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                {t(`moodCheck.moods.${selectedMoodAfter}`)}
              </p>
              {shiftIntensity != null && (
                <p className="text-xs text-muted-foreground">
                  {t('pause.shiftIntensitySummary', { defaultValue: 'Shift {{n}} / 5', n: shiftIntensity })}
                </p>
              )}
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
          ) : (
            <button type="button" onClick={onMoodAfterReset} className="group flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t('common.skipped', { defaultValue: 'Skipped' })}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
          )}

          {showGroundingNudge && (
            <motion.div
              className="mt-2 max-w-[280px] space-y-2 rounded-2xl border border-border/30 bg-card/30 px-4 py-3 text-center backdrop-blur-sm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('pause.groundingNudge', {
                  defaultValue: 'Still feeling it? Maybe step away and try {{activity}} for a few minutes.',
                  activity: suggestedActivity,
                })}
              </p>
              <button
                type="button"
                onClick={() => navigate(TOOLS.ground)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline"
              >
                <Anchor className="h-2.5 w-2.5" />
                {t('pause.goGround', { defaultValue: 'Ground yourself' })}
              </button>
            </motion.div>
          )}

          <button type="button" onClick={onContinue} className={pauseStepLayout.textContinue}>
            {t('pause.steps.continue', { defaultValue: 'Continue' })}
          </button>
        </motion.div>
      )}

      {onBack && (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
