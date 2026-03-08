import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Eye, PenLine, Target, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { RitualBreathing, RitualReflect, RitualJournal, RitualDecide } from './ritual';

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

interface HolzenRitualProps {
  open: boolean;
  onClose: () => void;
  template: RitualTemplate;
  reflectionMessage?: string;
  reflectionId?: string | null;
  onDecision?: (decision: string, journal?: string) => void;
}

export function HolzenRitual({ open, onClose, template, reflectionMessage, reflectionId, onDecision }: HolzenRitualProps) {
  const { user } = useAuth();
  const { mantra, motivations } = useHolzen();
  const steps = TEMPLATES[template]
    .map((id) => ALL_STEPS.find((s) => s.id === id)!)
    .filter(Boolean);

  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [decision, setDecision] = useState('');
  const [showMantra, setShowMantra] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const hasMantra = !!(mantra || motivations.length > 0);

  // Show mantra briefly before the first step
  useEffect(() => {
    if (open && hasMantra && currentStep === 0 && !completed) {
      setShowMantra(true);
      const timer = setTimeout(() => setShowMantra(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [open, hasMantra, currentStep, completed]);

  const step = steps[currentStep];

  const advance = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
      hapticFeedback('success');
    }
  }, [currentStep, steps.length]);

  const skipStep = useCallback(() => {
    // Can't skip the final decide step
    if (step.id === 'decide') return;
    hapticFeedback('light');
    advance();
  }, [step, advance]);

  const persistCompletion = useCallback(async (d: string, journal: string) => {
    if (!user) return;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Save to ritual_completions
    await supabase.from('ritual_completions' as any).insert({
      user_id: user.id,
      reflection_id: reflectionId || null,
      template,
      decision: d,
      journal_text: journal || null,
      duration_seconds: durationSeconds,
    });

    // Save journal text to the reflection's note field if linked
    if (reflectionId && journal) {
      await supabase
        .from('reflections')
        .update({ note: journal })
        .eq('id', reflectionId)
        .eq('user_id', user.id);
    }
  }, [user, reflectionId, template]);

  const handleDecision = useCallback((d: string) => {
    setDecision(d);
    onDecision?.(d, journalText);
    persistCompletion(d, journalText);
    setCompleted(true);
    hapticFeedback('success');
  }, [onDecision, journalText, persistCompletion]);

  const handleClose = useCallback(() => {
    setCurrentStep(0);
    setCompleted(false);
    setJournalText('');
    setDecision('');
    setShowMantra(false);
    startTimeRef.current = Date.now();
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

            {/* Step label + skip */}
            {!completed && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-[0.2em] text-center">
                  {step.label} · {currentStep + 1}/{steps.length}
                </p>
                {step.id !== 'decide' && (
                  <button
                    onClick={skipStep}
                    className="flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                  >
                    Skip <ChevronRight className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            )}

            {/* Mantra overlay */}
            <AnimatePresence>
              {showMantra && (
                <motion.div
                  key="mantra"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="flex flex-col items-center gap-4 py-12 text-center"
                >
                  {mantra && (
                    <p className="text-sm font-mono text-foreground/70 italic leading-relaxed max-w-xs">
                      "{mantra}"
                    </p>
                  )}
                  {!mantra && motivations.length > 0 && (
                    <p className="text-xs font-mono text-muted-foreground/60 tracking-wider uppercase">
                      Remember why you hold
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

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
              ) : !showMantra ? (
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
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
