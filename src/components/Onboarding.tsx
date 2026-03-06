import { useState, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface Props {
  onComplete: (threshold: number) => void;
}

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

  const totalSteps = steps.length + 1;
  const isLastStep = step === steps.length;

  const goTo = useCallback((next: number) => {
    setDirection(next > step ? 'forward' : 'back');
    setTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setTransitioning(false);
    }, 250);
  }, [step]);

  const transitionStyle: React.CSSProperties = {
    transition: 'opacity 250ms ease, transform 250ms ease',
    opacity: transitioning ? 0 : 1,
    transform: transitioning
      ? `translateY(${direction === 'forward' ? '12px' : '-12px'})`
      : 'translateY(0)',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12">
        <div style={transitionStyle}>
          {!isLastStep ? (
            <>
              <div className="space-y-6">
                <p className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
                  {steps[step].heading}
                </p>
                <p className="text-lg leading-relaxed">
                  {steps[step].body}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-10">
                {step > 0 && (
                  <button
                    onClick={() => goTo(step - 1)}
                    className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => goTo(step + 1)}
                  className="text-xs font-mono text-muted-foreground underline hover:text-foreground transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
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
