import { useState, useCallback, forwardRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Props {
  onComplete: (threshold: number) => void;
}

const sampleReflection = {
  context: 'BTC is down 7.2% in the last 24 hours.',
  message: 'A sharp move invites reaction. This is a moment to observe the impulse before following it.',
  haiku: 'Numbers fall like rain\nThe urge to act rises fast\nBreathe before you move',
  learningTitle: 'Panic Selling and Recovery',
  learningBody: 'After Bitcoin\'s 30% drop in May 2021, it recovered within three months. Historically, sharp declines have often preceded periods of consolidation rather than further collapse.',
};

const steps = [
  {
    heading: 'Holzen',
    body: 'The market moves. You feel the pull to act. This app exists for the space between impulse and decision.',
  },
  {
    heading: 'Not advice',
    body: 'No signals. No predictions. Just a mirror — so you can see yourself clearly before you move.',
  },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [direction, setDirection] = useState(1);
  const [breathingDemo, setBreathingDemo] = useState(false);
  const [haikuExpanded, setHaikuExpanded] = useState(false);
  const [learningExpanded, setLearningExpanded] = useState(false);
  const prefersReduced = useReducedMotion();

  const totalSteps = steps.length + 2; // text steps + companions + threshold
  const isPreviewStep = step === steps.length;
  const isThresholdStep = step === steps.length + 1;

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 1 : -1);
    if (next !== steps.length) {
      setBreathingDemo(false);
      setHaikuExpanded(false);
      setLearningExpanded(false);
    }
    setStep(next);
  }, [step]);

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const variants = prefersReduced
    ? { enter: {}, center: {}, exit: {} }
    : {
        enter: (d: number) => ({ opacity: 0, y: d > 0 ? 40 : -40 }),
        center: { opacity: 1, y: 0 },
        exit: (d: number) => ({ opacity: 0, y: d > 0 ? -20 : 20 }),
      };

  const transition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.5, ease };

  const stagger = (delay: number) =>
    prefersReduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.4, ease } };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="min-h-[420px] relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
            >
              {/* Text steps */}
              {step < steps.length && (
                <div className="space-y-8">
                  <motion.p
                    className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground"
                    {...stagger(0.1)}
                  >
                    {steps[step].heading}
                  </motion.p>
                  <motion.p
                    className="text-xl leading-relaxed text-foreground"
                    {...stagger(0.2)}
                  >
                    {steps[step].body}
                  </motion.p>
                  <motion.div {...stagger(0.4)}>
                    <Nav
                      showBack={step > 0}
                      onBack={() => goTo(step - 1)}
                      onNext={() => goTo(step + 1)}
                    />
                  </motion.div>
                </div>
              )}

              {/* Companion preview */}
              {isPreviewStep && (
                <div className="space-y-6">
                  <motion.p
                    className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground"
                    {...stagger(0.1)}
                  >
                    Your companions
                  </motion.p>
                  <motion.p
                    className="text-sm text-muted-foreground leading-relaxed"
                    {...stagger(0.15)}
                  >
                    Each reflection comes with tools to help you pause. Try them.
                  </motion.p>

                  <motion.div
                    className="rounded-md border border-border/60 bg-muted/20 px-4 py-4 space-y-4"
                    {...stagger(0.25)}
                  >
                    <p className="text-[10px] font-mono text-muted-foreground/60">
                      {sampleReflection.context}
                    </p>
                    <p className="text-sm leading-relaxed">
                      {sampleReflection.message}
                    </p>

                    <div className="space-y-3 pt-3 border-t border-border/30">
                      <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                        Pause with this
                      </p>

                      {/* Breathing */}
                      <AnimatePresence mode="wait">
                        {breathingDemo ? (
                          <motion.div
                            key="breathing-active"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-2 py-3"
                          >
                            <motion.div
                              className="rounded-full bg-foreground/10"
                              style={{ width: 48, height: 48 }}
                              animate={{ scale: [0.6, 1, 1, 0.6] }}
                              transition={{ duration: 12, repeat: Infinity, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
                            />
                            <p className="text-[10px] font-mono text-muted-foreground">
                              Inhale… hold… exhale…
                            </p>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="breathing-prompt"
                            onClick={() => setBreathingDemo(true)}
                            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                            whileHover={prefersReduced ? {} : { x: 4 }}
                          >
                            Breathe with this →
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Haiku */}
                      <AnimatePresence mode="wait">
                        {haikuExpanded ? (
                          <motion.div
                            key="haiku-expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <HaikuDisplay haiku={sampleReflection.haiku} />
                          </motion.div>
                        ) : (
                          <motion.button
                            key="haiku-prompt"
                            onClick={() => setHaikuExpanded(true)}
                            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                            whileHover={prefersReduced ? {} : { x: 4 }}
                          >
                            Read as haiku →
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Learning */}
                      <AnimatePresence mode="wait">
                        {learningExpanded ? (
                          <motion.div
                            key="learning-expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <LearningInput
                              title={sampleReflection.learningTitle}
                              body={sampleReflection.learningBody}
                            />
                          </motion.div>
                        ) : (
                          <motion.button
                            key="learning-prompt"
                            onClick={() => setLearningExpanded(true)}
                            className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                            whileHover={prefersReduced ? {} : { x: 4 }}
                          >
                            Learn from history →
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  <motion.p className="text-[10px] text-muted-foreground/60" {...stagger(0.35)}>
                    Toggle companions anytime in Settings.
                  </motion.p>

                  <motion.div {...stagger(0.4)}>
                    <Nav showBack onBack={() => goTo(step - 1)} onNext={() => goTo(step + 1)} />
                  </motion.div>
                </div>
              )}

              {/* Threshold step */}
              {isThresholdStep && (
                <div className="space-y-8">
                  <motion.p
                    className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground"
                    {...stagger(0.1)}
                  >
                    Your threshold
                  </motion.p>
                  <motion.p
                    className="text-sm text-muted-foreground leading-relaxed"
                    {...stagger(0.15)}
                  >
                    How much does BTC need to move in 24 hours before you hear from us?
                  </motion.p>
                  <motion.div {...stagger(0.25)}>
                    <p className="text-4xl font-mono tracking-tight mb-6">{threshold.toFixed(1)}%</p>
                    <Slider
                      value={[threshold]}
                      onValueChange={([v]) => setThreshold(v)}
                      min={1}
                      max={20}
                      step={0.5}
                      className="w-full"
                    />
                    <p className="text-[10px] text-muted-foreground/60 mt-3">
                      You can change this later.
                    </p>
                  </motion.div>

                  <motion.div className="flex items-center gap-4" {...stagger(0.35)}>
                    <button
                      onClick={() => goTo(step - 1)}
                      className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Back
                    </button>
                    <Button
                      onClick={() => onComplete(threshold)}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                    >
                      Begin
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress */}
        <motion.div
          className="flex gap-2 items-center mt-12"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[...Array(totalSteps)].map((_, i) => (
            <motion.div
              key={i}
              className="h-px bg-foreground"
              animate={{
                width: i === step ? '2rem' : '1rem',
                opacity: i <= step ? 1 : 0.2,
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {step + 1}/{totalSteps}
          </span>
        </motion.div>
      </div>
    </div>
  );
}

import { forwardRef } from 'react';

const Nav = forwardRef<HTMLDivElement, {
  showBack: boolean;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}>(function Nav({ showBack, onBack, onNext, nextLabel = 'Continue' }, ref) {
  return (
    <div ref={ref} className="flex items-center gap-4 pt-2">
      {showBack && (
        <button
          onClick={onBack}
          className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>
      )}
      <button
        onClick={onNext}
        className="text-xs font-mono text-muted-foreground underline hover:text-foreground transition-colors"
      >
        {nextLabel}
      </button>
    </div>
  );
});
