import { useState, useCallback } from 'react';
import { Dumbbell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  action: string; // e.g. "Go for a run", "Cold shower", "Stretch"
  durationMinutes?: number;
  onComplete: () => void;
}

export function RitualPhysical({ action, durationMinutes = 5, onComplete }: Props) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(durationMinutes * 60);
  const [done, setDone] = useState(false);

  const start = useCallback(() => {
    setStarted(true);
    hapticFeedback('light');
    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDone(true);
          hapticFeedback('success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const skip = useCallback(() => {
    hapticFeedback('light');
    onComplete();
  }, [onComplete]);

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Dumbbell className="h-6 w-6 text-primary/60" />
        <p className="text-xs font-mono text-muted-foreground">{t('ritual.physical.completed')}</p>
        <Button variant="outline" size="sm" onClick={onComplete} className="font-mono text-xs">
          {t('common.continue')}
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="h-16 w-16 rounded-full border border-border/40 flex items-center justify-center">
          <Dumbbell className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-mono">{action}</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">{durationMinutes} min</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={start} className="font-mono text-xs">
            {t('common.begin')}
          </Button>
          <Button variant="ghost" size="sm" onClick={skip} className="font-mono text-xs text-muted-foreground/50">
            {t('common.skip')}
          </Button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / (durationMinutes * 60);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative">
        <svg width="100" height="100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--border))" strokeWidth="2" opacity={0.3} />
          <circle
            cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress)}`}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-mono tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>
        </div>
      </div>
      <p className="text-xs font-mono text-muted-foreground/60">{action}</p>
      <Button variant="ghost" size="sm" onClick={() => { setDone(true); hapticFeedback('success'); }} className="font-mono text-[10px] text-muted-foreground/40">
        {t('ritual.physical.finishEarly')}
      </Button>
    </div>
  );
}
