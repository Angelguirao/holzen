import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { MoodCheck, type MoodValue } from '@/components/MoodCheck';
import { MoodIcon } from '@/components/icons/MoodIcon';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';
import { cn } from '@/lib/utils';

type LocalPhase = 'pick' | 'intensity';

interface Props {
  onMoodSelect: (mood: MoodValue, intensity?: number) => void;
  onMoodSkip: () => void;
  onMoodReset: () => void;
  moodDone: boolean;
  selectedMood?: MoodValue | null;
  /** 1–5 when user confirmed feel; null if skipped or legacy session. */
  feelIntensity?: number | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseFeel({
  onMoodSelect,
  onMoodSkip,
  onMoodReset,
  moodDone,
  selectedMood,
  feelIntensity,
  onContinue,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const [localPhase, setLocalPhase] = useState<LocalPhase>('pick');
  const [pendingMood, setPendingMood] = useState<MoodValue | null>(null);
  const [intensity, setIntensity] = useState(3);

  useEffect(() => {
    if (!moodDone) {
      setLocalPhase('pick');
      setPendingMood(null);
      setIntensity(3);
    }
  }, [moodDone]);

  const handlePick = (mood: MoodValue) => {
    setPendingMood(mood);
    setLocalPhase('intensity');
  };

  const handleSkipPick = () => {
    onMoodSkip();
  };

  const confirmIntensity = () => {
    if (pendingMood) {
      onMoodSelect(pendingMood, intensity);
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
      {!moodDone ? (
        localPhase === 'pick' ? (
          <>
            <motion.p
              className={pauseStepLayout.screenTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {t('pause.labelWhatYouFeel', { defaultValue: 'What are you feeling right now?' })}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-full"
            >
              <MoodCheck onSelect={handlePick} onSkip={handleSkipPick} variant="before" hideHeading />
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
              {t('pause.feelIntensityTitle', { defaultValue: 'How strong is this feeling?' })}
            </p>
            {pendingMood && (
              <button
                type="button"
                onClick={backFromIntensity}
                className="group flex flex-col items-center gap-1"
              >
                <MoodIcon mood={pendingMood} size={32} className="text-muted-foreground transition-colors group-hover:text-foreground" />
                <p className="text-sm font-medium text-foreground">{t(`moodCheck.moods.${pendingMood}`)}</p>
                <p className="text-xs text-muted-foreground">{t('pause.tapToChange', { defaultValue: 'tap to change' })}</p>
              </button>
            )}
            <div className="flex w-full flex-col gap-3">
              <div className="flex justify-between px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <span>{t('pause.feelIntensityLow', { defaultValue: 'Light' })}</span>
                <span>{t('pause.feelIntensityHigh', { defaultValue: 'Strong' })}</span>
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
          {selectedMood ? (
            <button type="button" onClick={onMoodReset} className="group flex flex-col items-center gap-2">
              <MoodIcon mood={selectedMood} size={28} className="text-muted-foreground transition-colors group-hover:text-foreground" />
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                {t(`moodCheck.moods.${selectedMood}`)}
              </p>
              {feelIntensity != null && (
                <p className="text-xs text-muted-foreground">
                  {t('pause.feelIntensitySummary', {
                    defaultValue: 'Intensity {{n}} / 5',
                    n: feelIntensity,
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
          ) : (
            <button type="button" onClick={onMoodReset} className="group flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t('common.skipped', { defaultValue: 'Skipped' })}
              </p>
              <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground/80">
                {t('pause.tapToChange', { defaultValue: 'tap to change' })}
              </p>
            </button>
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
