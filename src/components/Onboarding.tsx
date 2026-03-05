import { useState } from 'react';
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

  const isLastStep = step === steps.length;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-12">
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
            <button
              onClick={() => setStep(step + 1)}
              className="text-xs font-mono text-muted-foreground underline"
            >
              Continue
            </button>
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
            <Button
              onClick={() => onComplete(threshold)}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
            >
              Begin
            </Button>
          </>
        )}

        {/* Step indicator */}
        <div className="flex gap-2">
          {[...Array(steps.length + 1)].map((_, i) => (
            <div
              key={i}
              className={`h-px w-8 transition-colors ${
                i <= step ? 'bg-foreground' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
