import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Eye, PenLine, Target, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { hapticFeedback } from '@/lib/haptics';

export type RitualTemplate = 'quick' | 'standard' | 'deep';

export interface RitualStep {
  id: 'breathe' | 'reflect' | 'journal' | 'decide';
  label: string;
  icon: typeof Wind;
}

const ALL_STEPS: RitualStep[] = [
  { id: 'breathe', label: 'Breathe', icon: Wind },
  { id: 'reflect', label: 'Reflect', icon: Eye },
  { id: 'journal', label: 'Journal', icon: PenLine },
  { id: 'decide', label: 'Decide', icon: Target },
];

const TEMPLATES: Record<RitualTemplate, string[]> = {
  quick: ['breathe', 'decide'],
  standard: ['breathe', 'reflect', 'decide'],
  deep: ['breathe', 'reflect', 'journal', 'decide'],
};

export const TEMPLATE_LABELS: Record<RitualTemplate, { label: string; description: string }> = {
  quick: { label: 'Quick', description: 'Breathe → Decide' },
  standard: { label: 'Standard', description: 'Breathe → Reflect → Decide' },
  deep: { label: 'Deep', description: 'Breathe → Reflect → Journal → Decide' },
};

const outcomes = [
  { value: 'held', label: 'Hold' },
  { value: 'sold', label: 'Sell' },
  { value: 'bought', label: 'Buy' },
  { value: 'nothing', label: 'Nothing' },
] as const;

// Minimal inline breathing for the ritual (self-contained, no overlay)
function RitualBreathing({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [cycle, setCycle] = useState(0);
  const [started, setStarted] = useState(false);
  const totalCycles = 3;

  const runCycle = useCallback(() => {
    setPhase('inhale');
    setTimeout(() => {
      setPhase('hold');
      setTimeout(() => {
        setPhase('exhale');
        setTimeout(() => {
          setCycle((prev) => {
            const next = prev + 1;
            if (next >= totalCycles) {
              hapticFeedback('success');
              onComplete();
              return next;
            }
            // Recurse for next cycle
            runCycle();
            return next;
          });
        }, 4000);
      }, 4000);
    }, 4000);
  }, [onComplete]);

  const handleStart = () => {
    setStarted(true);
    hapticFeedback('light');
    runCycle();
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="h-16 w-16 rounded-full border border-border/40 flex items-center justify-center">
          <Wind className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          3 cycles of box breathing. 4 seconds each phase.
        </p>
        <Button variant="outline" size="sm" onClick={handleStart} className="font-mono text-xs">
          Begin breathing
        </Button>
      </div>
    );
  }

  const phaseLabel = phase === 'inhale' ? 'Inhale' : phase === 'hold' ? 'Hold' : 'Exhale';
  const scale = phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1.1;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <motion.div
        className="h-20 w-20 rounded-full border-2 border-primary/30 flex items-center justify-center"
        animate={{ scale }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <span className="text-sm font-mono text-primary/70">{phaseLabel}</span>
      </motion.div>
      <p className="text-[10px] font-mono text-muted-foreground/50">
        {cycle + 1} / {totalCycles}
      </p>
    </div>
  );
}

function RitualReflect({ message, onComplete }: { message?: string; onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Eye className="h-6 w-6 text-muted-foreground/40" />
      {message ? (
        <p className="text-sm leading-relaxed text-center max-w-sm">{message}</p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-sm italic">
          Sit with the moment. Notice your impulses without acting on them. What is the market making you feel?
        </p>
      )}
      <Button variant="outline" size="sm" onClick={() => { hapticFeedback('light'); onComplete(); }} className="font-mono text-xs">
        I've reflected
      </Button>
    </div>
  );
}

function RitualJournal({ onComplete }: { onComplete: (text: string) => void }) {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex items-center gap-2 text-muted-foreground/60">
        <PenLine className="h-4 w-4" />
        <p className="text-xs font-mono">Write it out before you act</p>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's driving this impulse? What would future-you think?"
        className="min-h-[100px] text-sm resize-none bg-muted/20 border-border/40"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => { hapticFeedback('light'); onComplete(text); }}
        className="font-mono text-xs self-end"
      >
        Done writing
      </Button>
    </div>
  );
}

function RitualDecide({ onComplete }: { onComplete: (decision: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Target className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground text-center">
        You've paused. You've reflected. Now decide intentionally.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {outcomes.map((o) => (
          <Button
            key={o.value}
            variant="outline"
            size="sm"
            onClick={() => { hapticFeedback('medium'); onComplete(o.value); }}
            className="font-mono text-xs"
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

interface HolzenRitualProps {
  open: boolean;
  onClose: () => void;
  template: RitualTemplate;
  reflectionMessage?: string;
  onDecision?: (decision: string, journal?: string) => void;
}

export function HolzenRitual({ open, onClose, template, reflectionMessage, onDecision }: HolzenRitualProps) {
  const steps = TEMPLATES[template]
    .map((id) => ALL_STEPS.find((s) => s.id === id)!)
    .filter(Boolean);

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [decision, setDecision] = useState('');

  const step = steps[currentStep];

  const advance = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
      hapticFeedback('success');
    }
  }, [currentStep, steps.length]);

  const handleDecision = useCallback((d: string) => {
    setDecision(d);
    onDecision?.(d, journalText);
    setCompleted(true);
    hapticFeedback('success');
  }, [onDecision, journalText]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setCompleted(false);
    setJournalText('');
    setDecision('');
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="w-full max-w-sm mx-auto px-6">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                      i < currentStep || completed
                        ? 'bg-primary'
                        : i === currentStep
                        ? 'bg-primary/60'
                        : 'bg-muted-foreground/20'
                    }`}
                  />
                  {i < steps.length - 1 && (
                    <div className={`h-px w-6 transition-colors duration-300 ${
                      i < currentStep ? 'bg-primary/40' : 'bg-muted-foreground/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step label */}
            {!completed && (
              <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em] text-center mb-2">
                {step.label} · {currentStep + 1}/{steps.length}
              </p>
            )}

            {/* Step content */}
            <AnimatePresence mode="wait">
              {completed ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-6 py-8"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-mono">Ritual complete</p>
                    {decision && (
                      <p className="text-xs text-muted-foreground">
                        Decision: <span className="text-foreground">{decision}</span>
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClose} className="font-mono text-xs">
                    Return
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.id === 'breathe' && <RitualBreathing onComplete={advance} />}
                  {step.id === 'reflect' && <RitualReflect message={reflectionMessage} onComplete={advance} />}
                  {step.id === 'journal' && <RitualJournal onComplete={(t) => { setJournalText(t); advance(); }} />}
                  {step.id === 'decide' && <RitualDecide onComplete={handleDecision} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
