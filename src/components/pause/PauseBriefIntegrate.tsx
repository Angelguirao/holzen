import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

const INTEGRATE_SECONDS = 20;

interface Props {
  done: boolean;
  onComplete: () => void;
}

export function PauseBriefIntegrate({ done, onComplete }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(INTEGRATE_SECONDS);
  const autoFired = useRef(false);

  useEffect(() => {
    if (done) {
      setRemaining(0);
      return;
    }
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (done || remaining > 0 || autoFired.current) return;
    autoFired.current = true;
    onComplete();
  }, [remaining, done, onComplete]);

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full max-w-md flex-col gap-6 text-center">
        <div className="space-y-2">
          <h2 className={pauseStepLayout.screenTitle}>{t('pause.brief.integrate.title', { defaultValue: 'Integrate' })}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('pause.brief.integrate.line1', { defaultValue: 'Sit, and quiet your mind.' })}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('pause.brief.integrate.line2', { defaultValue: 'Do nothing — just be here.' })}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 px-6 py-8">
          <p className="font-mono text-4xl font-medium tabular-nums text-foreground">
            {done ? '0' : Math.max(0, remaining)}
            <span className="text-lg text-muted-foreground">s</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('pause.brief.integrate.hint', { defaultValue: 'When you are ready, you can continue early.' })}
          </p>
        </div>

        <Button type="button" variant="secondary" className="w-full sm:w-auto sm:self-center" onClick={onComplete}>
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
        </Button>
      </div>
    </motion.div>
  );
}
