import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PauseProgress, type PauseStep } from '@/components/pause/PauseProgress';
import { PauseScienceSheet } from '@/components/pause/PauseScienceSheet';

interface Props {
  curtainLifted: boolean;
  prefersReducedMotion: boolean;
  onClose: () => void;
  phase: 'session' | 'done';
  step: PauseStep;
  goToStep: (next: PauseStep) => void;
  children: ReactNode;
}

/**
 * Cinematic shell for /pause: curtain, gradient, ambient orbs, close + progress chrome.
 */
export function PauseSessionScaffold({
  curtainLifted,
  prefersReducedMotion,
  onClose,
  phase,
  step,
  goToStep,
  children,
}: Props) {
  return (
    <>
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        <motion.div
          className="fixed top-1/4 left-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <button
          onClick={onClose}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all duration-300 z-[60] border border-border/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {phase === 'session' && (
          <motion.div
            className="fixed top-5 left-5 z-[55] flex max-w-[min(calc(100vw-5.5rem),20rem)] flex-col items-start gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <PauseProgress currentStep={step} onStepClick={goToStep} />
            </div>
            <PauseScienceSheet />
          </motion.div>
        )}

        <div className="relative z-10 mx-auto max-w-lg overflow-hidden px-5 py-16 sm:px-8 sm:py-20">{children}</div>
      </motion.div>
    </>
  );
}
