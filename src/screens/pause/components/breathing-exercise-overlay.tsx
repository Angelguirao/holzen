import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type {
  BreathingExerciseSeverity,
  StandaloneBreathingPattern,
  StandaloneBreathSeverityRingColors,
} from '@/features/pause/public';

export type BreathingExerciseOverlayProps = {
  severity: BreathingExerciseSeverity;
  ringColors: StandaloneBreathSeverityRingColors;
  patterns: readonly StandaloneBreathingPattern[];
  patternIndex: number;
  suggestedPatternIndex: number;
  active: boolean;
  completed: boolean;
  phaseLabelKey: string;
  phaseMotionKey: string;
  orbScale: number;
  secondsRemaining: number;
  cycle: number;
  totalCycles: number;
  patternNameKey: string;
  onClose: () => void;
  onSelectPattern: (index: number) => void;
  onStart: () => void;
};

/** Full-screen standalone breathing overlay (picker, timed loop, completion). */
export function BreathingExerciseOverlay({
  severity,
  ringColors,
  patterns,
  patternIndex,
  suggestedPatternIndex,
  active,
  completed,
  phaseLabelKey,
  phaseMotionKey,
  orbScale,
  secondsRemaining,
  cycle,
  totalCycles,
  patternNameKey,
  onClose,
  onSelectPattern,
  onStart,
}: BreathingExerciseOverlayProps) {
  const { t } = useTranslation();
  const { ringColor, ringBorder } = ringColors;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-300 z-10"
        aria-label={t('common.done')}
      >
        <X className="h-5 w-5" />
      </button>

      {completed ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 text-center px-6"
        >
          <div
            className="w-20 h-20 rounded-full border-2 transition-colors duration-500"
            style={{ borderColor: ringBorder, backgroundColor: ringColor }}
          />
          <p className="text-sm font-mono text-foreground">{t('breathing.settled')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
            {t('breathing.settledDesc')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono text-muted-foreground underline hover:text-foreground transition-colors mt-4"
          >
            {t('breathing.return')}
          </button>
        </motion.div>
      ) : !active ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-8 px-6 max-w-sm"
        >
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
            {t('breathing.choosePattern')}
          </p>
          <div className="space-y-2 w-full">
            {patterns.map((p, i) => (
              <button
                key={p.nameKey}
                type="button"
                onClick={() => onSelectPattern(i)}
                className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                  patternIndex === i
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <p className="text-xs font-mono font-medium">{t(p.nameKey)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(p.descKey)}</p>
              </button>
            ))}
          </div>
          {severity !== 'mild' && patternIndex === suggestedPatternIndex ? (
            <p className="text-[10px] text-muted-foreground/50 font-mono">
              {t('breathing.suggestedForVolatility')}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onStart}
            className="text-xs font-mono text-foreground underline hover:text-muted-foreground transition-colors"
          >
            {t('breathing.begin')}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <motion.div
            className="rounded-full border-2"
            style={{
              width: 140,
              height: 140,
              borderColor: ringBorder,
              backgroundColor: ringColor,
            }}
            animate={{ scale: orbScale }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          />
          <motion.p
            key={phaseMotionKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-mono text-muted-foreground capitalize"
          >
            {t(phaseLabelKey)}
          </motion.p>
          <p className="text-[10px] font-mono text-muted-foreground/50">{secondsRemaining}</p>
          <p className="text-[10px] font-mono text-muted-foreground/40">
            {cycle + 1} / {totalCycles}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/30">{t(patternNameKey)}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
