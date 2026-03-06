import { useState, useEffect } from 'react';

interface Props {
  severity?: 'mild' | 'moderate' | 'high';
}

export function BreathingExercise({ severity = 'mild' }: Props) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  const [cycle, setCycle] = useState(0);
  const totalCycles = 3;

  // 4-4-4 breathing pattern
  const durations = { inhale: 4, hold: 4, exhale: 4 };

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (phase === 'inhale' && next >= durations.inhale) {
          setPhase('hold');
          return 0;
        }
        if (phase === 'hold' && next >= durations.hold) {
          setPhase('exhale');
          return 0;
        }
        if (phase === 'exhale' && next >= durations.exhale) {
          setCycle((c) => {
            if (c + 1 >= totalCycles) {
              setActive(false);
              return 0;
            }
            return c + 1;
          });
          setPhase('inhale');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [active, phase]);

  const progress = seconds / durations[phase];
  const scale = phase === 'inhale' ? 0.6 + progress * 0.4 : phase === 'hold' ? 1 : 1 - progress * 0.4;

  const pulseClass = severity === 'high' ? 'animate-pulse' : '';

  if (!active) {
    return (
      <button
        onClick={() => {
          setActive(true);
          setPhase('inhale');
          setSeconds(0);
          setCycle(0);
        }}
        className={`text-xs font-mono text-muted-foreground hover:text-foreground transition-colors ${pulseClass}`}
      >
        Breathe with this →
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div
        className="rounded-full bg-foreground/10 transition-transform duration-1000 ease-in-out"
        style={{
          width: 80,
          height: 80,
          transform: `scale(${scale})`,
        }}
      />
      <p className="text-xs font-mono text-muted-foreground capitalize">
        {phase}
      </p>
      <p className="text-[10px] font-mono text-muted-foreground/50">
        {cycle + 1} / {totalCycles}
      </p>
    </div>
  );
}
