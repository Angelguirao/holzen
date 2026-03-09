import { useState, useCallback } from 'react';
import { Scan, Check } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

/** Simplified 5-4-3-2-1 grounding for ritual context */
const SENSES = [
  { count: 5, key: 'see' },
  { count: 4, key: 'hear' },
  { count: 3, key: 'feel' },
  { count: 2, key: 'smell' },
  { count: 1, key: 'taste' },
] as const;

export function RitualGrounding({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [senseIndex, setSenseIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const current = SENSES[senseIndex];
  const totalSteps = SENSES.reduce((s, x) => s + x.count, 0);
  const doneSteps = SENSES.slice(0, senseIndex).reduce((s, x) => s + x.count, 0) + count;

  const tap = useCallback(() => {
    hapticFeedback('light');
    const next = count + 1;
    if (next >= current.count) {
      if (senseIndex + 1 >= SENSES.length) {
        hapticFeedback('success');
        onComplete();
        return;
      }
      setSenseIndex(senseIndex + 1);
      setCount(0);
    } else {
      setCount(next);
    }
  }, [count, current, senseIndex, onComplete]);

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <Scan className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground text-center max-w-[240px]">
          {t('ritual.grounding.intro')}
        </p>
        <Button variant="outline" size="sm" onClick={() => setStarted(true)} className="font-mono text-xs">
          {t('common.begin')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <p className="text-xs font-mono text-muted-foreground/60">
        {t(`practice.sense_${current.key}`, { count: current.count - count })}
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: current.count }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              background: i < count ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              opacity: i < count ? 0.7 : 0.3,
            }}
          />
        ))}
      </div>
      <button
        onClick={tap}
        className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-95 transition-all"
      />
      <p className="text-[9px] font-mono text-muted-foreground/30">
        {doneSteps}/{totalSteps}
      </p>
    </div>
  );
}
