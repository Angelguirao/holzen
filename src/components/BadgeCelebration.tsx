import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/haptics';

export interface NewBadge {
  id: string;
  label: string;
  description: string;
  color: string;
}

interface BadgeCelebrationProps {
  badges: NewBadge[];
  onDismiss: () => void;
}

export function BadgeCelebration({ badges, onDismiss }: BadgeCelebrationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    hapticFeedback('success');
  }, [currentIndex]);

  const badge = badges[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < badges.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onDismiss();
    }
  }, [currentIndex, badges.length, onDismiss]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          key={badge.id}
          className="flex flex-col items-center gap-6 px-6 max-w-xs text-center"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glow ring */}
          <motion.div
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
          >
            <div
              className="h-24 w-24 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${badge.color}20, transparent 70%)`,
                boxShadow: `0 0 60px ${badge.color}30`,
              }}
            >
              <motion.div
                className="h-16 w-16 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: badge.color }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Award className="h-7 w-7" style={{ color: badge.color }} />
              </motion.div>
            </div>

            {/* Particle dots */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: badge.color,
                  top: '50%',
                  left: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 6) * 60,
                  y: Math.sin((i * Math.PI * 2) / 6) * 60,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.8 }}
              />
            ))}
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
              Badge unlocked
            </p>
            <p className="text-lg font-mono font-medium text-foreground">
              {badge.label}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {badge.description}
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="font-mono text-xs"
            >
              {currentIndex < badges.length - 1 ? 'Next badge' : 'Continue'}
            </Button>
            {badges.length > 1 && currentIndex < badges.length - 1 && (
              <button
                onClick={onDismiss}
                className="text-[9px] font-mono text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors tracking-[0.1em] uppercase"
              >
                Skip all
              </button>
            )}
          </motion.div>

          {badges.length > 1 && (
            <motion.p
              className="text-[9px] font-mono text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {currentIndex + 1} / {badges.length}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
