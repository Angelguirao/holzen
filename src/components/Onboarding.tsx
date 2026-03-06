import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { HaikuDisplay } from '@/components/HaikuDisplay';
import { LearningInput } from '@/components/LearningInput';

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
    body: 'When Bitcoin moves sharply, this app sends you one short message — a prompt to pause before acting.',
  },
  {
    heading: 'No advice',
    body: 'Holzen does not tell you what to do. It notices volatility and asks you to notice yourself.',
  },
];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [breathingDemo, setBreathingDemo] = useState(false);
  const [haikuExpanded, setHaikuExpanded] = useState(false);
  const [learningExpanded, setLearningExpanded] = useState(false);

  // Steps: 0-1 text, 2 companion preview, 3 threshold
  const totalSteps = steps.length + 2;
  const isPreviewStep = step === steps.length;
  const isThresholdStep = step === steps.length + 1;

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 'forward' : 'back');
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
      // Reset companion states when entering/leaving preview
      if (next !== steps.length) {
        setBreathingDemo(false);
        setHaikuExpanded(false);
        setLearningExpanded(false);
      }
    }, 250);
  }, [step]);

  const transitionStyle: React.CSSProperties = {
    transition: 'opacity 250ms ease, transform 250ms ease',
    opacity: transitioning ? 0 : 1,
    transform: transitioning
      ? `translateY(${direction === 'forward' ? '12px' : '-12px'})`
      : 'translateY(0)',
  };

  const renderNav = (showBack: boolean, onNext: () => void, nextLabel = 'Continue') => (
    <div className="flex items-center gap-4 mt-10">
      {showBack && (
        <button
          onClick={() => goTo(step - 1)}
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12">
        <div style={transitionStyle}>
          {/* Text steps */}
          {step < steps.length && (
            <>
              <div className="space-y-6">
                <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
                  {steps[step].heading}
                </p>
                <p className="text-lg leading-relaxed">
                  {steps[step].body}
                </p>
              </div>
              {renderNav(step > 0, () => goTo(step + 1))}
            </>
          )}

          {/* Companion preview step */}
          {isPreviewStep && (
            <>
              <div className="space-y-6">
                <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
                  Your companions
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each reflection comes with optional companions — tools to help you pause. Try them.
                </p>

                {/* Sample reflection */}
                <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-4 space-y-4">
                  <p className="text-[10px] font-mono text-muted-foreground/60">
                    {sampleReflection.context}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {sampleReflection.message}
                  </p>

                  {/* Companion prompts */}
                  <div className="space-y-3 pt-3 border-t border-border/30">
                    <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
                      Pause with this
                    </p>

                    {/* Breathing demo */}
                    {breathingDemo ? (
                      <div className="animate-fade-in flex flex-col items-center gap-2 py-3">
                        <div
                          className="rounded-full bg-foreground/10 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                          style={{ width: 48, height: 48 }}
                        />
                        <p className="text-[10px] font-mono text-muted-foreground">
                          Inhale… hold… exhale…
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setBreathingDemo(true)}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Breathe with this →
                      </button>
                    )}

                    {/* Haiku demo */}
                    {haikuExpanded ? (
                      <div className="animate-fade-in">
                        <HaikuDisplay haiku={sampleReflection.haiku} />
                      </div>
                    ) : (
                      <button
                        onClick={() => setHaikuExpanded(true)}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Read as haiku →
                      </button>
                    )}

                    {/* Learning demo */}
                    {learningExpanded ? (
                      <div className="animate-fade-in">
                        <LearningInput
                          title={sampleReflection.learningTitle}
                          body={sampleReflection.learningBody}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setLearningExpanded(true)}
                        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Learn from history →
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/60">
                  You can enable or disable companions anytime in Settings.
                </p>
              </div>
              {renderNav(true, () => goTo(step + 1))}
            </>
          )}

          {/* Threshold step */}
          {isThresholdStep && (
            <>
              <div className="space-y-6">
                <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
                  Set your threshold
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Choose how much BTC needs to move in 24 hours before you receive a reflection.
                </p>
                <p className="text-3xl font-mono tracking-tight">{threshold.toFixed(1)}%</p>
                <Slider
                  value={[threshold]}
                  onValueChange={([v]) => setThreshold(v)}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  You can change this later.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-10">
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
              </div>
            </>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 items-center">
          {[...Array(totalSteps)].map((_, i) => (
            <div
              key={i}
              className="h-px transition-all duration-500 ease-out"
              style={{
                width: i === step ? '2rem' : '1rem',
                backgroundColor: i <= step
                  ? 'hsl(var(--foreground))'
                  : 'hsl(var(--border))',
              }}
            />
          ))}
          <span className="text-[10px] font-mono text-muted-foreground ml-2">
            {step + 1}/{totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}