import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type Pattern = {
  name: string;
  description: string;
  phases: { label: string; duration: number }[];
};

const PATTERNS: Pattern[] = [
  {
    name: 'Box',
    description: '4-4-4-4 · Grounding',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Exhale', duration: 4 },
      { label: 'Hold', duration: 4 },
    ],
  },
  {
    name: 'Calming',
    description: '4-7-8 · Deep calm',
    phases: [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 7 },
      { label: 'Exhale', duration: 8 },
    ],
  },
  {
    name: 'Sigh',
    description: 'Physiological sigh',
    phases: [
      { label: 'Inhale', duration: 3 },
      { label: 'Sip', duration: 1 },
      { label: 'Exhale', duration: 6 },
    ],
  },
];

function getSuggestedPattern(severity: 'mild' | 'moderate' | 'high'): number {
  if (severity === 'high') return 1; // Calming 4-7-8
  if (severity === 'moderate') return 0; // Box
  return 0; // Box
}

interface Props {
  severity?: 'mild' | 'moderate' | 'high';
  onComplete?: () => void;
  autoOpen?: boolean;
}

export function BreathingExercise({ severity = 'mild', onComplete, autoOpen = false }: Props) {
  const [overlayOpen, setOverlayOpen] = useState(false);
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
    reset();
  }, [reset]);

  // Timer
  useEffect(() => {
    if (!active || completed) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= currentPhase.duration) {
          // Move to next phase
          const nextPhaseIndex = phaseIndex + 1;
          if (nextPhaseIndex >= pattern.phases.length) {
            // End of cycle
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

  // Ring scale/progress
  const progress = currentPhase.duration > 0 ? elapsed / currentPhase.duration : 0;
  const isExpand = currentPhase.label === 'Inhale' || currentPhase.label === 'Sip';
  const isContract = currentPhase.label === 'Exhale';
  const scale = isExpand ? 0.5 + progress * 0.5 : isContract ? 1 - progress * 0.5 : 1;

  // Severity-based color
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

  // Inline trigger button
  if (!overlayOpen) {
    return (
      <button
        onClick={openOverlay}
        className={`text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ${pulseClass}`}
      >
        Breathe with this →
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          {/* Close button */}
          <button
            onClick={closeOverlay}
            className="absolute top-6 right-6 text-muted-foreground/40 hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Completed state */}
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
              <p className="text-sm font-mono text-foreground">Settled.</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px]">
                You gave yourself a moment. That's enough.
              </p>
              <button
                onClick={closeOverlay}
                className="text-xs font-mono text-muted-foreground underline hover:text-foreground transition-colors mt-4"
              >
                Return
              </button>
            </motion.div>
          ) : !active ? (
            /* Pattern selection */
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-8 px-6 max-w-sm"
            >
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                Choose a pattern
              </p>
              <div className="space-y-2 w-full">
                {PATTERNS.map((p, i) => (
                  <button
                    key={p.name}
                    onClick={() => setPatternIndex(i)}
                    className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                      patternIndex === i
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-xs font-mono font-medium">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.description}</p>
                  </button>
                ))}
              </div>
              {severity !== 'mild' && patternIndex === getSuggestedPattern(severity) && (
                <p className="text-[10px] text-muted-foreground/50 font-mono">
                  Suggested for current volatility
                </p>
              )}
              <button
                onClick={startExercise}
                className="text-xs font-mono text-foreground underline hover:text-muted-foreground transition-colors"
              >
                Begin
              </button>
            </motion.div>
          ) : (
            /* Active breathing */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8"
            >
              {/* Ring */}
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

              {/* Phase label */}
              <motion.p
                key={`${phaseIndex}-${cycle}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-mono text-muted-foreground capitalize"
              >
                {currentPhase.label}
              </motion.p>

              {/* Countdown */}
              <p className="text-[10px] font-mono text-muted-foreground/50">
                {currentPhase.duration - elapsed}
              </p>

              {/* Cycle progress */}
              <p className="text-[10px] font-mono text-muted-foreground/40">
                {cycle + 1} / {totalCycles}
              </p>

              {/* Pattern name */}
              <p className="text-[10px] font-mono text-muted-foreground/30">
                {pattern.name}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
