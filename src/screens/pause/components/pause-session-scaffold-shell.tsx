import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type PauseSessionScaffoldShellProps = {
  prefersReducedMotion: boolean;
  children: ReactNode;
};

/** Scrollable pause shell with gradient background and ambient motion orbs. */
export function PauseSessionScaffoldShell({ prefersReducedMotion, children }: PauseSessionScaffoldShellProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.3 }}
      style={{
        background:
          'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
      }}
    >
      <motion.div
        className="pointer-events-none fixed left-1/3 top-1/4 h-[300px] w-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={prefersReducedMotion ? {} : { x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none fixed bottom-1/3 right-1/4 h-[250px] w-[250px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={prefersReducedMotion ? {} : { x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {children}
    </motion.div>
  );
}
