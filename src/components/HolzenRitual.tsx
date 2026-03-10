import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight, Sparkles, Wand2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useHolzen } from '@/hooks/use-holzen';
import { useTranslation } from 'react-i18next';
import {
  RitualBreathing, RitualReflect, RitualJournal, RitualDecide,
  RitualPhysical, RitualSelfReview, RitualGrounding, RitualCheckIn,
} from './ritual';
import { STEP_REGISTRY, PRESET_TEMPLATES, type StepData } from './ritual/stepRegistry';
import { RitualBuilder } from './RitualBuilder';
import { MoodCheck, type MoodValue } from './MoodCheck';

interface SavedTemplate {
  id: string;
  name: string;
  description: string | null;
  steps: StepData[];
  is_preset: boolean;
}

interface HolzenRitualProps {
  open: boolean;
  onClose: () => void;
  reflectionMessage?: string;
  reflectionId?: string | null;
  onDecision?: (decision: string, journal?: string) => void;
  /** If provided, skip template selection and use these steps */
  initialSteps?: StepData[];
  initialTemplateName?: string;
  /** Quick-start: skip template selection and use default ritual */
  quickStart?: boolean;
}

export function HolzenRitual({
  open, onClose, reflectionMessage, reflectionId, onDecision,
  initialSteps, initialTemplateName, quickStart,
}: HolzenRitualProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { mantra, motivations } = useHolzen();

  const [phase, setPhase] = useState<'mood-before' | 'select' | 'build' | 'run' | 'ai-loading' | 'mood-after'>('mood-before');
  const [steps, setSteps] = useState<StepData[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [decision, setDecision] = useState('');
  const [showMantra, setShowMantra] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState<any[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const [moodBefore, setMoodBefore] = useState<MoodValue | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodValue | null>(null);

  const hasMantra = !!(mantra || motivations.length > 0);

  // Load saved templates
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from('ritual_templates' as any)
        .select('id, name, description, steps, is_preset')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setSavedTemplates((data as unknown as SavedTemplate[]) ?? []);
      setLoadingTemplates(false);
    })();
  }, [open, user]);

  // Auto-start if initial steps provided
  useEffect(() => {
    if (open && initialSteps) {
      setSteps(initialSteps);
      setTemplateName(initialTemplateName || 'Custom');
      setPhase('mood-before');
      startTimeRef.current = Date.now();
    }
  }, [open, initialSteps, initialTemplateName]);

  // Quick-start: use default "standard" preset
  useEffect(() => {
    if (open && quickStart && !initialSteps) {
      const std = PRESET_TEMPLATES.find((p) => p.id === 'standard')!;
      setSteps([...std.steps] as StepData[]);
      setTemplateName('standard');
      setPhase('mood-before');
      startTimeRef.current = Date.now();
    }
  }, [open, quickStart, initialSteps]);

  // Mantra at start of run
  useEffect(() => {
    if (phase === 'run' && hasMantra && currentStep === 0 && !completed) {
      setShowMantra(true);
      const timer = setTimeout(() => setShowMantra(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [phase, hasMantra, currentStep, completed]);

  const step = steps[currentStep];

  const advance = useCallback(() => {
    setStepsCompleted((prev) => [...prev, { type: step?.type, completedAt: new Date().toISOString() }]);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
      hapticFeedback('success');
    }
  }, [currentStep, steps.length, step]);

  const skipStep = useCallback(() => {
    if (step?.type === 'decide') return;
    hapticFeedback('light');
    setStepsCompleted((prev) => [...prev, { type: step?.type, skipped: true }]);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCompleted(true);
      hapticFeedback('success');
    }
  }, [step, currentStep, steps.length]);

  const persistCompletion = useCallback(async (d: string, journal: string) => {
    if (!user) return;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    await supabase.from('ritual_completions' as any).insert({
      user_id: user.id,
      reflection_id: reflectionId || null,
      template: templateName,
      decision: d,
      journal_text: journal || null,
      duration_seconds: durationSeconds,
      steps_completed: stepsCompleted,
    });
    if (reflectionId && journal) {
      await supabase.from('reflections').update({ note: journal }).eq('id', reflectionId).eq('user_id', user.id);
    }
  }, [user, reflectionId, templateName, stepsCompleted]);

  const handleDecision = useCallback((d: string) => {
    setDecision(d);
    onDecision?.(d, journalText);
    persistCompletion(d, journalText);
    hapticFeedback('success');
    // Go to post-ritual mood check instead of immediately completing
    setPhase('mood-after');
  }, [onDecision, journalText, persistCompletion]);

  const handleMoodBefore = useCallback((mood: MoodValue) => {
    hapticFeedback('light');
    setMoodBefore(mood);
    if (steps.length > 0) {
      setPhase('run');
    } else {
      setPhase('select');
    }
  }, [steps.length]);

  const handleMoodBeforeSkip = useCallback(() => {
    if (steps.length > 0) {
      setPhase('run');
    } else {
      setPhase('select');
    }
  }, [steps.length]);

  const handleMoodAfter = useCallback((mood: MoodValue) => {
    hapticFeedback('light');
    setMoodAfter(mood);
    setCompleted(true);
  }, []);

  const handleMoodAfterSkip = useCallback(() => {
    setCompleted(true);
  }, []);

  const handleClose = useCallback(() => {
    setPhase('mood-before');
    setCurrentStep(0);
    setCompleted(false);
    setJournalText('');
    setDecision('');
    setShowMantra(false);
    setSteps([]);
    setStepsCompleted([]);
    setMoodBefore(null);
    setMoodAfter(null);
    startTimeRef.current = Date.now();
    onClose();
  }, [onClose]);

  const selectPreset = useCallback((preset: typeof PRESET_TEMPLATES[number]) => {
    setSteps([...preset.steps] as StepData[]);
    setTemplateName(preset.id);
    setPhase('run');
    startTimeRef.current = Date.now();
  }, []);

  const selectSaved = useCallback((tmpl: SavedTemplate) => {
    setSteps(tmpl.steps);
    setTemplateName(tmpl.name);
    setPhase('run');
    startTimeRef.current = Date.now();
  }, []);

  const handleBuilderSave = useCallback((newSteps: StepData[], name: string) => {
    setSteps(newSteps);
    setTemplateName(name);
    setPhase('run');
    startTimeRef.current = Date.now();
  }, []);

  const requestAISuggestion = useCallback(async () => {
    setPhase('ai-loading');
    try {
      const { data, error } = await supabase.functions.invoke('suggest-ritual', {
        body: { reflectionMessage, reflectionId },
      });
      if (error) throw error;
      if (data?.steps) {
        setSteps(data.steps);
        setTemplateName('AI Suggested');
        setPhase('run');
        startTimeRef.current = Date.now();
      } else {
        setPhase('select');
      }
    } catch {
      // Fallback to standard
      const std = PRESET_TEMPLATES.find((p) => p.id === 'standard')!;
      setSteps([...std.steps] as StepData[]);
      setTemplateName('standard');
      setPhase('run');
      startTimeRef.current = Date.now();
    }
  }, [reflectionMessage, reflectionId]);

  const stepLabel = step ? t(STEP_REGISTRY[step.type]?.label ?? step.type) : '';

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
          <button onClick={handleClose} className="absolute top-6 right-6 p-2 text-muted-foreground/40 hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>

          <div className="w-full max-w-sm mx-auto px-6 max-h-[80vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {/* ===== MOOD BEFORE ===== */}
              {phase === 'mood-before' && (
                <motion.div key="mood-before" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <MoodCheck onSelect={handleMoodBefore} onSkip={handleMoodBeforeSkip} variant="before" />
                </motion.div>
              )}

              {/* ===== TEMPLATE SELECTION ===== */}
              {phase === 'select' && (
                <motion.div key="select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50 text-center">
                    {t('ritual.selectTemplate')}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed text-center">
                    {t('ritual.intro')}
                  </p>

                  {/* Presets */}
                  <div className="space-y-2">
                    {PRESET_TEMPLATES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-border/40 hover:border-border/80 hover:bg-muted/20 transition-all group"
                      >
                        <div className="text-left">
                          <p className="text-xs font-mono">{t(preset.nameKey)}</p>
                          <p className="text-[10px] text-muted-foreground/50">{t(preset.descKey)}</p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground/30 group-hover:text-muted-foreground/60">
                          <span className="text-[9px] font-mono">{preset.steps.length}</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Saved custom templates */}
                  {savedTemplates.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono tracking-widest uppercase text-muted-foreground/40">
                        {t('ritual.yourTemplates')}
                      </p>
                      {savedTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => selectSaved(tmpl)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-border/40 hover:border-border/80 hover:bg-muted/20 transition-all group"
                        >
                          <div className="text-left">
                            <p className="text-xs font-mono">{tmpl.name}</p>
                            {tmpl.description && <p className="text-[10px] text-muted-foreground/50">{tmpl.description}</p>}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground/30 group-hover:text-muted-foreground/60">
                            <span className="text-[9px] font-mono">{tmpl.steps.length}</span>
                            <ChevronRight className="h-3 w-3" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPhase('build')} className="flex-1 font-mono text-xs gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t('ritual.buildYourOwn')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={requestAISuggestion} className="flex-1 font-mono text-xs gap-1.5">
                      <Wand2 className="h-3 w-3" />
                      {t('ritual.aiSuggest')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ===== BUILDER ===== */}
              {phase === 'build' && (
                <motion.div key="build" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <RitualBuilder
                    onSave={handleBuilderSave}
                    onCancel={() => setPhase('select')}
                  />
                </motion.div>
              )}

              {/* ===== AI LOADING ===== */}
              {phase === 'ai-loading' && (
                <motion.div key="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-16">
                  <Wand2 className="h-5 w-5 text-primary/60 animate-pulse" />
                  <p className="text-xs font-mono text-muted-foreground/60">{t('ritual.aiGenerating')}</p>
                </motion.div>
              )}

              {/* ===== RUNNING RITUAL ===== */}
              {phase === 'run' && (
                <motion.div key="run" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                          i < currentStep || completed ? 'bg-primary' : i === currentStep ? 'bg-primary/60' : 'bg-muted-foreground/20'
                        }`} />
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
                        {stepLabel} · {currentStep + 1}/{steps.length}
                      </p>
                      {step?.type !== 'decide' && (
                        <button onClick={skipStep} className="flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                          {t('common.skip')} <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mantra overlay */}
                  <AnimatePresence>
                    {showMantra && (
                      <motion.div key="mantra" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="flex flex-col items-center gap-4 py-12 text-center">
                        {mantra && <p className="text-sm font-mono text-foreground/70 italic leading-relaxed max-w-xs">"{mantra}"</p>}
                        {!mantra && motivations.length > 0 && <p className="text-xs font-mono text-muted-foreground/60 tracking-wider uppercase">{t('ritualFlow.rememberWhy')}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step content */}
                  <AnimatePresence mode="wait">
                    {completed ? (
                      <motion.div key="completed" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-8">
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
                    ) : !showMantra && step ? (
                      <motion.div key={`${step.type}-${currentStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        {step.type === 'breathe' && <RitualBreathing onComplete={advance} />}
                        {step.type === 'reflect' && <RitualReflect message={reflectionMessage} onComplete={advance} />}
                        {step.type === 'journal' && <RitualJournal onComplete={(txt) => { setJournalText(txt); advance(); }} />}
                        {step.type === 'decide' && <RitualDecide onComplete={handleDecision} />}
                        {step.type === 'physical' && <RitualPhysical action={step.action || 'Exercise'} durationMinutes={step.durationMinutes || 5} onComplete={advance} />}
                        {step.type === 'review' && <RitualSelfReview onComplete={advance} />}
                        {step.type === 'grounding' && <RitualGrounding onComplete={advance} />}
                        {step.type === 'checkin' && <RitualCheckIn onComplete={() => advance()} />}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
