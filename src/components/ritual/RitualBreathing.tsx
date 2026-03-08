import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

export function RitualBreathing({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
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
          {t('ritualBreathing.description')}
        </p>
        <Button variant="outline" size="sm" onClick={handleStart} className="font-mono text-xs">
          {t('ritualBreathing.beginBreathing')}
        </Button>
      </div>
    );
  }

  const phaseKey = `ritualBreathing.${phase}` as const;
  const scale = phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1.1;

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <motion.div
        className="h-20 w-20 rounded-full border-2 border-primary/30 flex items-center justify-center"
        animate={{ scale }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      >
        <span className="text-sm font-mono text-primary/70">{t(phaseKey)}</span>
      </motion.div>
      <p className="text-[10px] font-mono text-muted-foreground/50">
        {cycle + 1} / {totalCycles}
      </p>
    </div>
  );
}
