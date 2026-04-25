import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
}

/**
 * Shared immersive full-screen shell for practice pages.
 * Provides dark-curtain entrance, ambient orbs, and close button — matching /pause and /tools/breathe.
 */
export function ImmersivePracticeShell({ children, title, onClose }: Props) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [curtainLifted, setCurtainLifted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCurtainLifted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleReturn = onClose ?? (() => navigate('/', { replace: true }));

  return (
    <>
      {/* Dark curtain entrance */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        {/* Ambient orbs */}
        <motion.div
          className="fixed top-1/4 left-1/3 w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, 25, -15, 0], y: [0, -15, 10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="fixed bottom-1/3 right-1/4 w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, -20, 12, 0], y: [0, 18, -8, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Close button */}
        <button
          onClick={handleReturn}
          className="fixed top-5 right-5 p-3 rounded-full bg-muted/40 backdrop-blur-sm text-muted-foreground/40 hover:text-foreground/60 hover:bg-muted/60 transition-all duration-300 z-[60]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        {title && (
          <motion.p
            className="fixed top-7 left-1/2 -translate-x-1/2 z-[55] text-[8px] font-mono text-muted-foreground/30 tracking-[0.2em] uppercase"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {title}
          </motion.p>
        )}

        <div className="relative z-10 max-w-md mx-auto px-6 py-20 min-h-screen flex flex-col justify-center">
          {children}
        </div>
      </motion.div>
    </>
  );
}
