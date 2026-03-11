import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Pattern = {
  nameKey: string;
  descKey: string;
  phases: { labelKey: string; duration: number }[];
};

const PATTERNS: Pattern[] = [
  {
    nameKey: 'breathing.patterns.box',
    descKey: 'breathing.patterns.boxDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
      { labelKey: 'breathing.phases.exhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 4 },
    ],
  },
  {
    nameKey: 'breathing.patterns.calming',
    descKey: 'breathing.patterns.calmingDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 4 },
      { labelKey: 'breathing.phases.hold', duration: 7 },
      { labelKey: 'breathing.phases.exhale', duration: 8 },
    ],
  },
  {
    nameKey: 'breathing.patterns.sigh',
    descKey: 'breathing.patterns.sighDesc',
    phases: [
      { labelKey: 'breathing.phases.inhale', duration: 3 },
      { labelKey: 'breathing.phases.sip', duration: 1 },
      { labelKey: 'breathing.phases.exhale', duration: 6 },
    ],
  },
];

// For scale logic we still need to know the semantic phase type
const EXPAND_KEYS = ['breathing.phases.inhale', 'breathing.phases.sip'];
const CONTRACT_KEYS = ['breathing.phases.exhale'];

function getSuggestedPattern(severity: 'mild' | 'moderate' | 'high'): number {
  if (severity === 'high') return 1;
  if (severity === 'moderate') return 0;
  return 0;
}

interface Props {
  severity?: 'mild' | 'moderate' | 'high';
  onComplete?: () => void;
  onClose?: () => void;
  autoOpen?: boolean;
}

export function BreathingExercise({ severity = 'mild', onComplete, onClose, autoOpen = false }: Props) {
  const { t } = useTranslation();
  const [overlayOpen, setOverlayOpen] = useState(autoOpen);
  const [patternIndex, setPatternIndex] = useState(() => getSuggestedPattern(severity));
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [completed, setCompleted] = useState(false);
  const totalCycles = 3;

  const pattern = PATTERNS[patternIndex];
  const currentPhase = pattern.phases[phaseIndex];

  const pulseClass = severity === 'high' ? 'animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]' : '';

  const reset = useCallback(() => {
    setActive(false);
    setPhaseIndex(0);
    setElapsed(0);
    setCycle(0);
    setCompleted(false);
  }, []);

  const startExercise = useCallback(() => {
    reset();
    setActive(true);
  }, [reset]);

  const openOverlay = useCallback(() => {
    setPatternIndex(getSuggestedPattern(severity));
    reset();
    setOverlayOpen(true);
  }, [severity, reset]);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    if (!completed) onClose?.();
    reset();
  }, [reset, completed, onClose]);

  // Timer
  useEffect(() => {
    if (!active || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          const nextPhaseIndex = phaseIndex + 1;
          if (nextPhaseIndex >= pattern.phases.length) {
            const nextCycle = cycle + 1;
            if (nextCycle >= totalCycles) {
              setActive(false);
              setCompleted(true);
              onComplete?.();
              return 0;
            }
            setCycle(nextCycle);
            setPhaseIndex(0);
          } else {
            setPhaseIndex(nextPhaseIndex);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, completed, phaseIndex, cycle, currentPhase.duration, pattern.phases.length]);

  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = EXPAND_KEYS.includes(currentPhase.labelKey);
  const isContract = CONTRACT_KEYS.includes(currentPhase.labelKey);
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;

  const ringColor = severity === 'high'
    ? 'hsl(var(--destructive) / 0.2)'
    : severity === 'moderate'
    ? 'hsl(var(--primary) / 0.2)'
    : 'hsl(var(--muted-foreground) / 0.15)';

  const ringBorder = severity === 'high'
    ? 'hsl(var(--destructive) / 0.4)'
    : severity === 'moderate'
    ? 'hsl(var(--primary) / 0.4)'
    : 'hsl(var(--muted-foreground) / 0.25)';

  if (!overlayOpen) {
    return (
      <button
        onClick={openOverlay}
        className={`text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ${pulseClass}`}
      >
        {t('breathing.trigger')}
      </button>
    );
  }

  return (
    <AnimatePresence>
      {overlayOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background"
        >
          <button
            onClick={closeOverlay}
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
                onClick={closeOverlay}
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
                {PATTERNS.map((p, i) => (
                  <button
                    key={p.nameKey}
                    onClick={() => setPatternIndex(i)}
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
              {severity !== 'mild' && patternIndex === getSuggestedPattern(severity) && (
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                  {t('breathing.suggestedForVolatility')}
                </p>
              )}
              <button
                onClick={startExercise}
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
                animate={{ scale }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
              <motion.p
                key={`${phaseIndex}-${cycle}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-mono text-muted-foreground capitalize"
              >
                {t(currentPhase.labelKey)}
              </motion.p>
              <p className="text-[10px] font-mono text-muted-foreground/50">
                {currentPhase.duration - elapsed}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/40">
                {cycle + 1} / {totalCycles}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/30">
                {t(pattern.nameKey)}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
