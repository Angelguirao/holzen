import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  mantra: string | null;
  onContinue: () => void;
}

export function PauseBreathing({ mantra, onContinue }: Props) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [ready, setReady] = useState(false);

  // Auto-reveal continue after 4s
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.8 }}
    >
      {/* Breathing circle */}
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full border border-border/10 cursor-pointer"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
          }}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.12, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            hapticFeedback('light');
          }}
        />
        <motion.div
          className="absolute -inset-4 rounded-full border border-border/5 pointer-events-none"
          animate={prefersReducedMotion ? {} : { scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-[11px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase">
          {t('pause.youPaused')}
        </p>
        {mantra && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="text-[11px] font-mono text-muted-foreground/25 italic max-w-xs leading-relaxed"
          >
            "{mantra}"
          </motion.p>
        )}
      </div>

      {/* Continue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2 }}
        onClick={() => { hapticFeedback('light'); onContinue(); }}
        className="text-[10px] font-mono text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors duration-500 tracking-[0.15em] uppercase"
        disabled={!ready}
      >
        {t('pause.steps.continue', 'Continue')}
      </motion.button>
    </motion.div>
  );
}
