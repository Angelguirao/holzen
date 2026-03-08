import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Eye, PenLine, Target, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import { RitualBreathing, RitualReflect, RitualJournal, RitualDecide } from './ritual';

export type RitualTemplate = 'quick' | 'standard' | 'deep';

export interface RitualStep {
  id: 'breathe' | 'reflect' | 'journal' | 'decide';
  labelKey: string;
  icon: typeof Wind;
}

const ALL_STEPS: RitualStep[] = [
  { id: 'breathe', labelKey: 'breathing.phases.inhale', icon: Wind },
  { id: 'reflect', labelKey: 'ritual.reflect.iveReflected', icon: Eye },
  { id: 'journal', labelKey: 'ritualJournal.writeItOut', icon: PenLine },
  { id: 'decide', labelKey: 'ritual.decide.prompt', icon: Target },
];

// Step labels for the progress display
const STEP_LABEL_KEYS: Record<string, string> = {
  breathe: 'ritualBreathing.exhale',
  reflect: 'settings.companionLabels.zoomOut',
  journal: 'ritualJournal.writeItOut',
  decide: 'ritual.decide.hold',
};

const TEMPLATES: Record<RitualTemplate, string[]> = {
  quick: ['breathe', 'decide'],
  standard: ['breathe', 'reflect', 'decide'],
  deep: ['breathe', 'reflect', 'journal', 'decide'],
};

export const TEMPLATE_LABELS: Record<RitualTemplate, { labelKey: string; descKey: string }> = {
  quick: { labelKey: 'settings.ritualTemplates.quick', descKey: 'settings.ritualTemplates.quickDesc' },
  standard: { labelKey: 'settings.ritualTemplates.standard', descKey: 'settings.ritualTemplates.standardDesc' },
  deep: { labelKey: 'settings.ritualTemplates.deep', descKey: 'settings.ritualTemplates.deepDesc' },
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
  const { t } = useTranslation();
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
    if (step.id === 'decide') return;
    hapticFeedback('light');
    advance();
  }, [step, advance]);

  const persistCompletion = useCallback(async (d: string, journal: string) => {
    if (!user) return;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    await supabase.from('ritual_completions' as any).insert({
      user_id: user.id,
      reflection_id: reflectionId || null,
      template,
      decision: d,
      journal_text: journal || null,
      duration_seconds: durationSeconds,
    });

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

  // Simple step label for progress
  const stepLabels: Record<string, string> = {
    breathe: t('breathing.phases.inhale'),
    reflect: t('ritual.reflect.iveReflected'),
    journal: t('ritualJournal.writeItOut'),
    decide: t('ritual.decide.hold'),
  };

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
                  {stepLabels[step.id] || step.id} · {currentStep + 1}/{steps.length}
                </p>
                {step.id !== 'decide' && (
                  <button
                    onClick={skipStep}
                    className="flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                  >
                    {t('ritualFlow.skip')} <ChevronRight className="h-2.5 w-2.5" />
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
                      {t('ritualFlow.rememberWhy')}
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
                    <p className="text-sm font-mono">{t('ritualFlow.ritualComplete')}</p>
                    {decision && (
                      <p className="text-xs text-muted-foreground">
                        {t('ritualFlow.decision')}: <span className="text-foreground">{decision}</span>
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClose} className="font-mono text-xs">
                    {t('ritualFlow.return')}
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
                  {step.id === 'journal' && <RitualJournal onComplete={(txt) => { setJournalText(txt); advance(); }} />}
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
